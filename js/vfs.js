(function(window){
  var VFS={};
  class FileNode {
    constructor(parent, name, type) {
      this.parent = parent;
      parent.data["/" + name] = this;
      this.path = parent.path + "/" + name;
      this.name = name;
      this.type = type;
      if (type == "dir") {
        this.data = {};
      }
    }
    contains(name) {
      if (this.data["/" + name])
        return true;
      return false;
    }
    get(name) {
      return this.data["/" + name];
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
      return this.node.type == "dir";
    }

    /* Permission Information */
    canExec(){
      return this.node.data instanceof Function;
    }

    canRead(){
      return typeof (this.node.data) == "string";
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
      if (this.node.type != "dir")
        throw "Unsupported Operation";
      var ret = [];
      for (var i in this.node.data) {
        if (i[0] == "/")
          ret.push(i.substr(1));
      }
      return ret;
    }
    clear() {
      this.node.data = null;
      return this;
    }
  }

  VFS.root= Object.assign(Object.create(FileNode.prototype), {
    name:"",
    type:"dir",
    path:"",
    data:{}
  });
  VFS.root.parent=VFS.root;

  VFS.lookup=function lookup(fullpath, newFile){
    var path=fullpath.substr(1).split("/");
    var ifntype="file";
    if(!path[path.length - 1]){
      path.pop();
      ifntype="dir";
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
        if(!newFile){
          return null;
        }
        new FileNode(cur, subpath, i == path.length - 1?ifntype:"dir");
      }
      cur=cur.get(subpath);
    }
    return cur;
  }

  VFS.open=function open(fullpath, newFile){
    var file=VFS.lookup(fullpath, newFile);
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
