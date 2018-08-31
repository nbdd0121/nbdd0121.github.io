(function(){
  var versionText="echo (nbdd0121 coreutils) 1.0\n\Copyright (C) 2014 Gary Guo.\n";
  var helpMainText="Echo the STRING(s) to standard output.\n\n\
  -n             do not output the trailing newline\n\
  -e             enable interpretation of backslash escapes\n\
  -E             disable interpretation of backslash escapes (default)\n\
      --help     display this help and exit\n\
      --version  output version information and exit\n\n\
If -e is in effect, the following sequences are recognized:\n\n\
  Currently nothing is recognized\n\
Report echo bugs to nbdd0121@hotmail.com\n";
  function echo(lib, args, callback){
    if(args.length == 2){
      if(args[1] == "--version"){
        lib.puts(versionText);
        callback();
        return;
      }else if(args[1] == "--help"){
        lib.puts("Usage: " + args[0]
            + " [SHORT-OPTION]... [STRING]...\n  or:  " + args[0]
            + " LONG-OPTION\n");
        lib.puts(helpMainText);
        callback();
        return;
      }
    }
    var i;
    var escape=false;
    var trailing=true;
    for(i=1; i < args.length; i++){
      switch(args[i]){
        case "-n":
          trailing=false;
          continue;
        case "-e":
          escape=true;
          continue;
        case "-E":
          escape=false;
          continue;
      }
      break;
    }
    for(; i < args.length; i++){
      lib.puts(args[i] + " ");
    }
    if(trailing){
      lib.puts("\n");
    }
    callback();
  }
  VFS.open("/bin/echo", 'application/javascript').write(wrapCLib(echo));
})(VFS, wrapCLib);
