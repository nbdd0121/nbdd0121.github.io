// Polyfill for Edge
if (typeof window.TextEncoder === "undefined") {
  window.TextEncoder = function TextEncoder() { };
  TextEncoder.prototype.encode = function encode(str) {
    let ret = new Uint8Array(str.length * 3);
    let ptr = 0;
    for (let i = 0; i < str.length; i++) {
      let codepoint = str.charCodeAt(i);
      if (codepoint <= 0x007F) {
        ret[ptr++] = codepoint;
      } else if (codepoint <= 0x07FF) {
        ret[ptr++] = 0xC0 | (codepoint >> 6);
        ret[ptr++] = 0x80 | (codepoint & 0x3F);
      } else {
        ret[ptr++] = 0xE0 | (codepoint >> 12);
        ret[ptr++] = 0x80 | ((codepoint >> 6) & 0x3F);
        ret[ptr++] = 0x80 | (codepoint & 0x3F);
      }
    }
    return ret.slice(0, ptr);
  }

  window.TextDecoder = function TextDecoder() { };
  TextDecoder.prototype.decode = function decode(buf) {
    let codepoints = [];
    for (let i = 0; i < buf.length; i++) {
      let c = buf[i];
      if ((c & 0x80) == 0) {
        codepoints.push(c);
      } else if ((c & 0xE0) == 0xC0) {
        codepoints.push(((c & 0x1F) << 6) | (buf[++i] & 0x3F));
      } else if ((c & 0xF0) == 0xE0) {
        codepoints.push(((c & 0x0F) << 12) | ((buf[++i] & 0x3F) << 6) | (buf[++i] & 0x3F));
      }
    }
    return String.fromCharCode(...codepoints);
  }
}

// Filesystem registry
let VFS = {
  _fileSystemRegistry: Object.create(null),
  registerFs(name, mounter) {
    this._fileSystemRegistry[name] = mounter;
    console.info('[VFS] Registered filesystem ' + name);
  }
};

// File node superclass
VFS.FileNode = class FileNode {
  constructor(name, type, mode, length) {
    this.name = name;
    this.type = type;
    this.mode = mode;
    this.length = length;
    this.pointer = null;
  }

  read(offset, buffer) {
    if (this.pointer) return this.pointer.read(offset, buffer);
    if (this.doRead) return this.doRead(offset, buffer);
    throw new Error('read is not implemented');
  }

  write(offset, buffer) {
    if (this.pointer) return this.pointer.write(offset, buffer);
    if (this.doWrite) return this.doWrite(offset, buffer);
    throw new Error('write is not implemented');
  }

  readdir() {
    if (this.pointer) return this.pointer.readdir();
    if (this.doReaddir) return this.doReaddir();
    throw new Error('readdir is not implemented');
  }

  async finddir(name) {
    if (this.pointer) return this.pointer.finddir(name);
    if (this.doFinddir) return this.doFinddir(name);
    let list = await this.readdir();
    for (let item of list) {
      if (item.name == name) return item;
    }
    return null;
  }

  create(name, type = 'file', mode = 0o666) {
    if (this.pointer) return this.pointer.create(name, type, mode);
    if (this.doCreate) return this.doCreate(name, type, mode);
    throw new Error('create is not implemented');
  }

  mkdir(name, mode = 0o777) {
    if (this.pointer) return this.pointer.mkdir(name, mode);
    if (this.doMkdir) return this.doMkdir(name, mode);
    throw new Error('mkdir is not implemented');
  }

  chmod(mode) {
    if (this.pointer) return this.pointer.chmod(mode);
    if (this.doChmod) return this.doChmod(mode);
    throw new Error('chmod is not implemented');
  }

  mount(target, fs = '', ...mountParam) {
    if (this.pointer) throw new Error('this node is already mounted');
    if (fs !== '') {
      let mounter = VFS._fileSystemRegistry[fs];
      if (!mounter) throw new Error('cannot find file system ' + fs);
      target = mounter(target, ...mountParam);
    }
    this.pointer = target;
  }

  async lookup(path, create = '', mode) {
    if (path.length === 0) return this;
    if (path[0] == '/') return this.lookup(path.substr(1), create);
    let [subpath, rest] = path.split('/', 2);
    let node = await this.finddir(subpath);
    // Not the final level
    if (rest !== undefined) {
      if (node == null) return null;
      return node.lookup(rest, create, 0o777);
    }
    // Final level
    if (node == null) {
      if (!create) return null;
      if (mode === undefined) mode = create === 'dir' ? 0o777 : 0o666;
      node = await (create == 'dir' ? this.mkdir(subpath, mode) : this.create(subpath, create, mode));
    }
    while (node.pointer) {
      node = node.pointer;
    }
    return node;
  }

  open() {
    return new FileDesc(this);
  }
}

// RamFS
{
  class RamfsNode extends VFS.FileNode {
    constructor(name, type, mode, length) {
      super(name, type, mode, length);
      this.data = type == 'dir' ? [] : new Uint8Array(new ArrayBuffer(0));
    }

    async doRead(offset, buffer) {
      if (this.type === 'dir') throw new Error('read is not available on directory');
      let end = Math.min(offset + buffer.length, this.length);
      if (end <= offset) return 0;
      buffer.set(this.data.subarray(offset, end));
      return end - offset;
    }

    async doWrite(offset, buffer) {
      if (this.type === 'dir') throw new Error('write is not available on directory');
      // Expand buffer
      let newLength = offset + buffer.length;
      if (newLength > this.data) {
        let dataLen = Math.max(16, this.data.length * 2);
        while (dataLen < newLength) dataLen *= 2;
        let newBuffer = new Uint8Array(new ArrayBuffer(dataLen));
        newBuffer.set(this.data);
        this.data = newBuffer;
      }
      this.data.set(buffer, offset);
      this.length = newLength;
      return buffer.length;
    }

    async doReaddir() {
      if (this.type !== 'dir') throw new Error('readdir is only available on directory');
      return this.data;
    }

    async doCreate(name, type, mode) {
      if (this.data.find(item => item.name == name)) throw new Error('name duplicate');
      let ret = new RamfsNode(name, type, mode, 0);
      this.data.push(ret);
      return ret;
    }

    async doMkdir(name, mode) {
      if (this.data.find(item => item.name == name)) throw new Error('name duplicate');
      let ret = new RamfsNode(name, 'dir', mode, 0);
      this.data.push(ret);
      return ret;
    }

    async doChmod(mode) {
      this.mode = mode;
    }
  }

  VFS.registerFs('ramfs', _ => new RamfsNode('', 'dir', 0o777, 0));
}

// Register root

VFS.root = VFS._fileSystemRegistry['ramfs'](null);

// Utilities

VFS.resolve = function (path) {
  if (path[0] !== '/') throw new Error('must be absolute path');
  let segments = path.split('/');
  let stack = [];
  for (let seg of segments) {
    switch (seg) {
      case "":
      case ".":
        break;
      case "..":
        stack.pop();
        break;
      default:
        stack.push(seg);
        break;
    }
  }
  return '/' + stack.join('/');
}

VFS.lookup = function lookup(fullpath, create = '', mode = 0o666) {
  return VFS.root.lookup(VFS.resolve(fullpath).substr(1), create, mode);
}

VFS.mkdir = function lookup(fullpath, mode = 0o777) {
  return VFS.root.lookup(VFS.resolve(fullpath).substr(1), 'dir', mode);
}

// Opened files

function asBuf(object) {
  if (object instanceof Uint8Array) return object;
  if (object instanceof ArrayBuffer) return new Uint8Array(object);
  if (ArrayBuffer.isView(object)) return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
  return object;
}

function convToBuf(object) {
  if (object instanceof Uint8Array) return object;
  if (object instanceof ArrayBuffer) return new Uint8Array(object);
  if (ArrayBuffer.isView(object)) return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
  if (typeof object == 'string') return new TextEncoder('utf-8').encode(object);
  if (object instanceof Function) return new TextEncoder('utf-8').encode(object.toString() + '\n');
  throw new Error('unsupported type');
}

function convFromBuf(buf, type) {
  switch (type) {
    case 'Uint8Array': return buf;
    case 'string': return new TextDecoder('utf-8').decode(buf);
    default: throw new Error('unknown type');
  }
}

class FileDesc {
  constructor(node) {
    this.node = node;
    this.ptr = 0;
  }

  async list() {
    return (await this.node.readdir()).map(it => it.name);
  }

  async exec(env, args) {
    if (this.node.type !== 'file') throw new Error('cannot execute ' + this.node.type);
    if ((this.node.mode & 0o100) === 0) throw new Error('permission denied');
    let code = await this.readAll('string');
    let globalEval = eval;
    let func = globalEval('(' + code + ')\n//@ sourceURL=' + this.node.name + '.js');
    let envClone = Object.assign({}, env);
    return func(envClone, args, await new CLib(envClone));
  }

  // read(size, format = 'Uint8Array') -> [size, result]
  // read(buffer) -> [size, result]
  async read(buffer, format) {
    buffer = asBuf(buffer);
    if (buffer instanceof Uint8Array) {
      // Overload 2
      format = 'Uint8Array';
    } else {
      buffer = new Uint8Array(new ArrayBuffer(buffer));
    }
    let len = await this.node.read(this.ptr, buffer);
    this.ptr += len;
    return [len, convFromBuf(buffer.subarray(0, len), format)];
  }

  async readAll(buffer) {
    buffer = asBuf(buffer);
    let type = 'Uint8Array';
    if (!(buffer instanceof Uint8Array)) {
      type = buffer;
      buffer = new Uint8Array(new ArrayBuffer(this.node.length));
    }
    let len = await this.node.read(this.ptr, buffer);
    if (len != buffer.length) throw new Error('cannot read all');
    switch (type) {
      case 'Uint8Array': return buffer;
      case 'string': return new TextDecoder('utf-8').decode(buffer);
      default: throw new Error('unknown type');
    }
  }

  async writeAll(buffer) {
    buffer = convToBuf(buffer);
    let len = await this.node.write(this.ptr, buffer);
    if (len != buffer.length) throw new Error('cannot write all');
  }

  canRead() {
    return Boolean(this.node.mode & 0o400);
  }

  canExec() {
    return Boolean(this.node.mode & 0o100);
  }

  isDirectory() {
    return this.node.type === 'dir';
  }
}



VFS.open = async function open(fullpath, newFileType) {
  let file = await VFS.lookup(fullpath, newFileType);
  if (file) return new FileDesc(file);
  return null;
}

function loadFile(url) {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      var buffer = request.response;
      if (buffer) {
        resolve(new Uint8Array(buffer));
      } else {
        reject(new Error('Cannot not load ' + url));
      }
    };
    request.send(null);
  });
}

async function load(path, url) {
  let filePromise = VFS.lookup(path, 'file', 0o777);
  let buffer = await loadFile(url);
  return new FileDesc(await filePromise).writeAll(buffer);
}

VFS.load = load;
