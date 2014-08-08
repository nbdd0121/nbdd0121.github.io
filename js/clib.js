(function(window){
  function CLib(env){
    this.env=env;
    this.stdout=VFS.open("/dev/stdout");
    this.stdin=VFS.open("/dev/stdin");
  }
  function getFullPath(clib, path){
    if(path[0] != "/"){
      return clib.env.WORKING_DIRECTORY + path;
    }
    return path;
  }
  CLib.prototype={
    fopen:function fopen(path, newFlag){
      return VFS.open(getFullPath(this, path), newFlag);
    },
    puts:function puts(cont){
      this.stdout.write(cont);
    },

    /* POSIX */
    chdir:function chdir(path){
      var f=VFS.lookup(getFullPath(this, path));
      if(f == null){
        return -1;
      }
      this.env.WORKING_DIRECTORY=f.path + "/";
      return 0;
    },
    stat:function stat(path){
      var f=VFS.lookup(getFullPath(this, path));
      if(f == null){
        return null;
      }
      var opened=f.open();
      return {
        type:f.type,
        exec:opened.canExec()
      };
    },
    exec:function exec(cmd, args, callback){
      if(cmd[0]!="/"){
        var onceNonnull=false;
        var pathSplit=this.env.PATH.split(";");
        if(cmd.indexOf("/")!=-1){
          pathSplit.push(this.WORKING_DIRECTORY);
        }
        for(var i=0;i<pathSplit.length;i++){
          var p=pathSplit[i];
          var file=VFS.open(p+"/"+cmd);
          if(file==null){
            continue;
          }
          if(!file.canExec()){
            if(file.isDirectory()){
              onceNonnull="Is a directory";
            }else{
              onceNonnull="Permission denied"
            }
            continue;
          }
          file.exec(this.env, args, callback);
          return;
        }
        if(onceNonnull){
          throw onceNonnull;
        }else{
          throw "command not found";
        }
      }
      var file=VFS.open(cmd[0]);
      if(file==null){
        throw "command not found";
      }
      if(!file.canExec()){
        if(file.isDirectory()){
          throw "Is a directory";
        }else{
          throw "Permission denied"
        }
      }
      file.exec(this.env, args, callback);
    }
  };

  window.CLib=CLib;
  window.wrapCLib=function wrapCLib(func){
    return function(env, args, callback){
      func(new CLib(env), args, callback);
    };
  };
})(window);

(function(CLib){
  CLib.prototype.historyNextLine=function(callback, specKey){
    if(!this.HNLHistory){
      this.HNLHistory=[];
    }
    var history=this.HNLHistory;
    var id=history.length;
    this.stdin.readLine(function(val){
      if(history[history.length - 1] != val){
        history.push(val);
        id=history.length;
        if(history.length > 20){
          history.splice(0, history.length - 20);
          id=20;
        }
      }
      callback(val);
    }, function(key, element){
      if(key == "up"){
        if(id == 0){
          return;
        }
        if(id == history.length){
          inputBackup=element.val();
        }
        id--;
        element.val(history[id]);
      }else if(key == "down"){
        if(id == history.length){
          return;
        }
        id++;
        if(id == history.length){
          element.val(inputBackup);
        }else{
          element.val(history[id]);
        }
      }else{
        specKey&&specKey(key, element);
      }
    });
  }
})(CLib);
