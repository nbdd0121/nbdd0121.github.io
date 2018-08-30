(function(window){
  var VFS={};
  function FileNode(parent, name, type){
    this.parent=parent;
    parent.data["/" + name]=this;
    this.path=parent.path + "/" + name;
    this.name=name;
    this.type=type;
    if(type == "dir"){
      this.data={};
    }
  }
  function FileDesc(node){
    this.node=node;
    this.ptr=0;
  }

  FileNode.prototype.contains=function contains(name){
    if(this.data["/" + name])
      return true;
    return false;
  };
  FileNode.prototype.get=function get(name){
    return this.data["/" + name];
  };
  FileNode.prototype.open=function open(){
    return new FileDesc(this);
  };
  FileDesc.prototype={
    /* Type Information */
    isDirectory:function isDirectory(){
      return this.node.type == "dir";
    },
    /* Permission Information */
    canExec:function canExec(){
      return this.node.data instanceof Function;
    },
    canRead:function canRead(){
      return typeof (this.node.data) == "string";
    }
  }
  FileDesc.prototype.exec=function exec(env, args, callback){
    if(this.node.data instanceof Function){
      this.node.data(Object.assign({}, env), args, callback);
      return this;
    }
    throw "Unsupported Operation";
  };
  FileDesc.prototype.write=function write(str){
    if(this.node.data == null){
      this.node.data=str;
      return this;
    }
    if(typeof (this.node.data) == "string"){
      this.node.data+=str;
      return this;
    }
    throw "Unsupported Operation";
  };
  FileDesc.prototype.read=function read(callback){
    if(typeof (this.node.data) == "string"){
      if(this.ptr == this.node.data.length)
        return null;
      var ret=this.node.data[this.ptr];
      this.ptr++;
      callback(ret);
    }else{
      throw "Unsupported Operation";
    }
  };
  FileDesc.prototype.readLine=function readLine(callback){
    if(typeof (this.node.data) == "string"){
      var str=this.node.data;
      if(this.ptr == str.length){
        callback(null);
        return;
      }
      var id=str.indexOf("\n", this.ptr);
      if(id == -1){
        var ret=str.substr(this.ptr);
        this.ptr=str.length;
        callback(ret);
      }else{
        var ret=str.substr(this.ptr, id - this.ptr);
        this.ptr=id + 1;
        callback(ret);
      }
      return;
    }
    throw "Unsupported Operation";
  };
  FileDesc.prototype.list=function list(){
    if(this.node.type != "dir")
      throw "Unsupported Operation";
    var ret=[];
    for( var i in this.node.data){
      if(i[0] == "/")
        ret.push(i.substr(1));
    }
    return ret;
  };

  FileDesc.prototype.clear=function clear(){
    this.node.data=null;
    return this;
  };

  VFS.root={
    name:"",
    type:"dir",
    path:"",
    data:{},
    __proto__:FileNode.prototype
  }
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
