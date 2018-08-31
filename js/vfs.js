(function(window){
  var VFS={};

  class FileNode {
    constructor(parent, name, type) {
      this.parent = parent;
      parent.data[name] = this;
      this.path = parent.path + "/" + name;
      this.name = name;
      this.type = type;
      if (type == "inode/directory") {
        this.data = Object.create(null);
      }
    }

    contains(name) {
      if (this.data[name])
        return true;
      return false;
    }

    get(name) {
      return this.data[name];
    }

    open() {
      return new FileDesc(this);
    }
  }

  class FileDesc {
    constructor(node) {
      this.node = node;
      this.ptr = 0;
    }

    /* Type Information */
    isDirectory(){
      return this.node.type === "inode/directory";
    }

    /* Permission Information */
    canExec(){
      return this.node.type === 'application/javascript';
    }

    canRead(){
      return this.node.type === 'text/plain';
    }

    exec(env, args, callback) {
      if (this.node.data instanceof Function) {
        this.node.data(Object.assign({}, env), args, callback);
        return this;
      }
      throw "Unsupported Operation";
    }

    write(str) {
      if (this.node.data == null) {
        this.node.data = str;
        return this;
      }
      if (typeof (this.node.data) == "string") {
        this.node.data += str;
        return this;
      }
      throw "Unsupported Operation";
    }
    read(callback) {
      if (typeof (this.node.data) == "string") {
        if (this.ptr == this.node.data.length)
          return null;
        var ret = this.node.data[this.ptr];
        this.ptr++;
        callback(ret);
      }
      else {
        throw "Unsupported Operation";
      }
    }
    readLine(callback) {
      if (typeof (this.node.data) == "string") {
        var str = this.node.data;
        if (this.ptr == str.length) {
          callback(null);
          return;
        }
        var id = str.indexOf("\n", this.ptr);
        if (id == -1) {
          var ret = str.substr(this.ptr);
          this.ptr = str.length;
          callback(ret);
        }
        else {
          var ret = str.substr(this.ptr, id - this.ptr);
          this.ptr = id + 1;
          callback(ret);
        }
        return;
      }
      throw "Unsupported Operation";
    }

    list() {
      if (this.node.type != "inode/directory")
        throw "Unsupported Operation";
      return Object.keys(this.node.data);
    }

    clear() {
      this.node.data = null;
      return this;
    }
  }

  VFS.root= Object.assign(Object.create(FileNode.prototype), {
    name:"",
    type:"inode/directory",
    path:"",
    data:Object.create(null)
  });
  VFS.root.parent=VFS.root;

  VFS.lookup = function lookup(fullpath, newFileType){
    var path=fullpath.substr(1).split("/");

    if(path[path.length - 1] === ''){
      path.pop();
      if (newFileType !== undefined && newFileType !== 'inode/directory')
        throw 'Is a directory';
    }

    var cur=VFS.root;
    for(var i=0; i < path.length; i++){
      var subpath=path[i];
      switch(subpath){
        case "":
        case ".":
          continue;
        case "..":
          cur=cur.parent;
          continue;
      }

      if(!cur.contains(subpath)){
        if(newFileType === undefined){
          return null;
        }
        new FileNode(cur, subpath, i == path.length - 1?newFileType:"inode/directory");
      }
      cur=cur.get(subpath);
    }
    return cur;
  }

  VFS.open = function open(fullpath, newFileType) {
    var file=VFS.lookup(fullpath, newFileType);
    if(file)
      return file.open();
    return null;
  }

  VFS.dummyDescProto={
    /* Type Information */
    isDirectory:function isDirectory(){
      return false;
    },
    /* Permission Information */
    canExec:function canExec(){
      return false;
    },
    canRead:function canRead(){
      return false;
    },
  };

  window.VFS=VFS;
})(window);
