(function(VFS, wrapCLib){
  function ls(lib, args, callback){
    var file=args[1] || "";
    lib.chdir(file);
    
    var current=lib.fopen("").list();
    for(var i=0; i < current.length; i++){
      var f=current[i];
      var type=lib.stat(f).type;
      switch(type){
        case "dir":
          lib.puts("\033[1;34m" + current[i] + " \033[0m");
          break;
        case "dev":
          lib.puts("\033[1;33m" + current[i] + " \033[0m");
          break;
        default:
          lib.puts(current[i] + " ");
          break;
      }
    }
    lib.puts("\n");
    callback();
  }
  VFS.open("/bin/ls", true).write(wrapCLib(ls));
})(VFS, wrapCLib);
