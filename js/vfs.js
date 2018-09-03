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
  constructor(name, type, mode) {
    this.name = name;
    this.type = type;
    this.mode = mode;
    this.pointer = null;
  }

  length() {
    if (this.pointer) return this.pointer.length();
    if (this.doLength) return this.doLength();
    throw new Error('length is not implemented');
  }

  read(offset, buffer) {
    if (!(this.mode & 0o400)) throw new Error('Permission denied');
    if (this.pointer) return this.pointer.read(offset, buffer);
    if (this.doRead) return this.doRead(offset, buffer);
    throw new Error('read is not implemented');
  }

  write(offset, buffer) {
    if (!(this.mode & 0o200)) throw new Error('Permission denied');
    if (this.pointer) return this.pointer.write(offset, buffer);
    if (this.doWrite) return this.doWrite(offset, buffer);
    throw new Error('write is not implemented');
  }

  readdir() {
    if (!(this.mode & 0o100)) throw new Error('Permission denied');
    if (this.pointer) return this.pointer.readdir();
    if (this.doReaddir) return this.doReaddir();
    throw new Error('readdir is not implemented');
  }

  async finddir(name) {
    if (!(this.mode & 0o400)) throw new Error('Permission denied');
    if (this.pointer) return this.pointer.finddir(name);
    if (this.doFinddir) return this.doFinddir(name);
    if (!this.doReaddir) new Error('finddir is not implemented');
    let list = await this.doReaddir();
    for (let item of list) {
      if (item.name == name) return item;
    }
    return null;
  }

  create(name, type = 'file', mode = 0o666) {
    if (!(this.mode & 0o200)) throw new Error('Permission denied');
    if (this.pointer) return this.pointer.create(name, type, mode);
    if (this.doCreate) return this.doCreate(name, type, mode);
    throw new Error('create is not implemented');
  }

  mkdir(name, mode = 0o777) {
    if (!(this.mode & 0o200)) throw new Error('Permission denied');
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
      target = mounter(target, this, ...mountParam);
    }
    this.pointer = target;
  }

  async lookup(path, create = '', mode) {
    if (path.length === 0) return this;
    if (path[0] == '/') return this.lookup(path.substr(1), create);
    let pathIndex = path.indexOf('/');
    // Not the final level
    if (pathIndex !== -1) {
      let node = await this.finddir(path.substr(0, pathIndex));
      if (node == null) return null;
      return node.lookup(path.substr(pathIndex + 1), create, 0o777);
    }
    // Final level
    let node = await this.finddir(path);
    if (node == null) {
      if (!create) return null;
      if (mode === undefined) mode = create === 'dir' ? 0o777 : 0o666;
      node = await (create == 'dir' ? this.mkdir(path, mode) : this.create(path, create, mode));
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
      super(name, type, mode);
      this._length = length;
      this.data = type == 'dir' ? [] : new Uint8Array(new ArrayBuffer(0));
    }

    async doLength() {
      return this._length;
    }

    async doRead(offset, buffer) {
      if (this.type === 'dir') throw new Error('read is not available on directory');
      let end = Math.min(offset + buffer.length, this._length);
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
      this._length = newLength;
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

// NetFS
{
  class NetfsNode extends VFS.FileNode {
    constructor(name, type, mode, url) {
      // Write is not allowed
      super(name, type, mode & 0o555, 0);
      this.url = url;
      this.data = null;
    }

    async _load() {
      if (!this.data) {
        this.data = await loadFile(this.url);
        if (this.type === 'dir') {
          let text = new TextDecoder('utf-8').decode(this.data);
          this.data = [];
          for (let item of text.split('\n')) {
            item = item.trim();
            if (!item) continue;
            let [name, type, mode, url] = item.split(' ');
            this.data.push(new NetfsNode(name, type, parseInt(mode, 8), url));
          }
        }
      }
    }

    async doLength() {
      if (this.type === 'dir') throw new Error('length is not available on directory');
      await this._load();
      return this.data.length;
    }

    async doRead(offset, buffer) {
      if (this.type === 'dir') throw new Error('read is not available on directory');
      await this._load();
      let end = Math.min(offset + buffer.length, this.data.length);
      if (end <= offset) return 0;
      buffer.set(this.data.subarray(offset, end));
      return end - offset;
    }

    async doReaddir() {
      if (this.type !== 'dir') throw new Error('readdir is only available on directory');
      await this._load();
      return this.data;
    }
  }

  VFS.registerFs('netfs', (_, node, url) => new NetfsNode(node.name, node.type, node.mode, url));
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
    if ((this.node.mode & 0o100) === 0) throw new Error('Permission denied');
    if (this.node.type !== 'file') throw new Error('cannot execute ' + this.node.type);
    this.ptr = 0;
    let code = await this.readAll('string');
    let globalEval = eval;
    let func = globalEval('(' + code + ')\n//# sourceURL=' + this.node.name + '.js');
    let envClone = Object.assign({}, env);
    return func(envClone, args, new CLib(envClone));
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

  async readAll(format) {
    let length = await this.node.length();
    let [len, buf] = await this.read(length, format);
    if (len != length) throw new Error('cannot read all');
    return buf;
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
    request.onerror = () => {
      reject(new Error('Cannot not load ' + url));
    }
    request.onload = () => {
      resolve(new Uint8Array(request.response));
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

// Utility for synchronised initialisation

{
  let queue = [];
  async function start() {
    while (true) {
      let task = queue[0];
      await task();
      queue.shift();
      if (queue.length === 0) {
        return;
      }
    }
  }

  window.enqueueTask = function enqueueTask(task) {
    queue.push(task);
    if (queue.length === 1) {
      start();
    }
  }

  let loaded = Object.create(null);
  window.includeStylesheet = function(url) {
    if (url in loaded) return;
    loaded[url] = true;
    return new Promise((resolve, reject) => {
      let link = this.document.createElement('link');
      link.onload = resolve;
      link.onerror = reject;
      link.type = 'text/css';
      link.href = url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    });
  };
  window.includeScript = function(url, integrity) {
    if (url in loaded) return;
    loaded[url] = true;
    return new Promise((resolve, reject) => {
      let script = document.createElement("script");
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      if (integrity) {
        script.crossOrigin = 'anonymous';
        script.integrity = integrity;
      }
      script.type = 'application/javascript';
      document.head.appendChild(script);
    });
  };
}
