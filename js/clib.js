(function(window){
  function CLib(env){
    this.env=env;
    this.stdout=VFS.open("/dev/stdout");
    this.stdin=VFS.open("/dev/stdin");
  }
  CLib.prototype={
    fopen:function fopen(path, newFlag){
      if(path[0]!="/"){
        path=this.env.WORKING_DIRECTORY+path;
      }
      return VFS.open(path, newFlag);
    },
    puts:function puts(cont){
      this.stdout.write(cont);
    }
  };

  window.CLib=CLib;
  window.wrapCLib=function wrapCLib(func){
    return function(env, args, callback){
      func(new CLib(env), args, callback);
    };
  };
})(window);
