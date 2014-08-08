(function(VFS, wrapCLib){
  function bash(env, args, callback){
    var lib=new CLib(env);
    var builtinFunc={
      exit:function exit(args, cbk){
        callback();
      },
      logout:function exit(args, cbk){
        callback();
      },
      cd:function cd(args, cbk){
        if(!args[1]){
          env.WORKING_DIRECTORY=env.HOME;
        }else{
          var newPath=lib.fopen(args[1]);
          if(newPath == null){
            lib.puts("cd: " + args[1] + ": No such file or directory\n");
          }else if(!newPath.isDirectory()){
            lib.puts("cd: " + args[1] + ": Not a directory\n");
          }else{
            env.WORKING_DIRECTORY=newPath.node.path + "/";
          }
        }
        cbk();
      }
    };

    function simplifyPath(path){
      if(path == env.HOME){
        return "~";
      }else if(path.indexOf(env.HOME) == 0){
        return "~/" + path.substr(env.HOME.length);
      }else{
        return path;
      }
    }
    function printPrompt(dir){
      lib.puts("\033[1;34m" + simplifyPath(env.WORKING_DIRECTORY)
          + " \033[1;31m$ \033[0m");
    }
    function getAllPossibleChoices(paths, prefix){
      var pc=[];
      for(var i=0; i < paths.length; i++){
        var f=lib.fopen(paths[i]);
        if(!f)
          continue;
        f=f.list();
        for(var j=0; j < f.length; j++){
          if(f[j].indexOf(prefix) == 0){
            pc.push(f[j]);
          }
        }
      }
      return pc;
    }
    function extractCommon(arr){
      var common=arr[0];
      for(var i=1; i < arr.length; i++){
        common=common.common(arr[i]);
      }
      return common;
    }
    function execute(arg){
      var args=arg.trim().split(" ");
      for(var i=1; i < args.length - 1; i++){
        if(args[i] == ""){
          args.splice(i, 1);
          i--;
        }
      }
      if(args.length == 0){
        return;
      }
      if(builtinFunc[args[0]]){
        builtinFunc[args[0]](args, readAndExec);
        return;
      }
      try{
        lib.exec(args[0], args, readAndExec);
      }catch(e){
        lib.puts(args[0] + ": " + e + "\n");
        readAndExec();
      }
    }
    function readAndExec(){
      printPrompt();
      lib.historyNextLine(function(input){
        execute(input);
      }, function(key, element){
        if(key != "tab")
          return;
        var currentInput=element.val();
        if(currentInput == "")
          return;
        var currentArgIndex=currentInput.lastIndexOf(" ") + 1;
        if(currentArgIndex == 0 && currentInput.lastIndexOf("/") == -1){
          var pc=getAllPossibleChoices(env.PATH.split(";"), currentInput);
          if(pc.length == 0){
          }else if(pc.length == 1){
            element.val(pc[0]);
          }else{
            var ext=extractCommon(pc);
            if(ext == currentInput){
              /* Print out all possible alternative */
              element.remove();
              lib.puts(currentInput + "\n");
              for(var i=0; i < pc.length; i++){
                lib.puts(pc[i] + "  ");
              }
              lib.puts("\n");
              readAndExec();
              $("#inputbox").val(currentInput);
            }else{
              element.val(ext);
            }
          }
        }else{
          var prefix=currentInput.substr(0, currentArgIndex);
          var arg=currentInput.substr(currentArgIndex);
          var pathId=arg.lastIndexOf("/") + 1;
          var path=arg.substr(0, pathId);
          var file=arg.substr(pathId);
          var pc=getAllPossibleChoices([path], file);
          if(pc.length == 0){
          }else if(pc.length == 1){
            element.val(prefix + path + pc[0]);
          }else{
            var ext=extractCommon(pc);
            if(ext == file){
              /* Print out all possible alternative */
              element.remove();
              lib.puts(currentInput + "\n");
              for(var i=0; i < pc.length; i++){
                lib.puts(pc[i] + "  ");
              }
              lib.puts("\n");
              readAndExec();
              $("#inputbox").val(currentInput);
            }else{
              element.val(prefix + path + ext);
            }
          }
        }

      });
    }
    readAndExec();
  }
  VFS.open("/bin/bash", true).write(bash);
})(VFS, wrapCLib);
