(function(window){
  function CLib(env){
    this.env=env;
    this.stdout=VFS.open("/dev/stdout");
    this.stdin=VFS.open("/dev/stdin");
  }
  function getFullPath(clib, path){
    if(path[0]!="/"){
      return clib.env.WORKING_DIRECTORY+path;
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
      if(f==null){
        return -1;
      }
      this.env.WORKING_DIRECTORY=f.path+"/";
      return 0;
    },
    stat:function stat(path){
      var f=VFS.lookup(getFullPath(this, path));
      if(f==null){
        return null;
      }
      return {
        type:f.type
      };
    }
  };

  window.CLib=CLib;
  window.wrapCLib=function wrapCLib(func){
    return function(env, args, callback){
      func(new CLib(env), args, callback);
    };
  };
})(window);
