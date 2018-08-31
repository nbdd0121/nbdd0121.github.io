VFS.lookup("/home/", 'inode/directory');

VFS.open("/bin/clear", 'application/javascript').write(function(env, args, callback){
  document.body.innerHTML = '<p></p>';
  callback();
});

VFS.open("/bin/pwd", 'application/javascript').write(function(env, args, callback){
  VFS.open("/dev/stdout").write(env.WORKING_DIRECTORY + "\n");
  callback();
});

VFS.open("/bin/cat", 'application/javascript').write(wrapCLib(function(lib, args, callback){
  if (args.length < 2) args[1] = '/dev/stdin';
  var current=lib.fopen(args[1]);
  if(current == null){
    lib.puts("cat: " + args[1] + ": No such file or directory\n");
    callback();
  }else if(current.isDirectory()){
    lib.puts("cat: " + args[1] + ": Is a directory\n");
    callback();
  }else if(!current.canRead()){
    lib.puts("cat: " + args[1] + ": Permission denied\n");
    callback();
  }else{
    function onRead(str){
      if(str == null){
        callback();
      }else{
        lib.puts(str+"\n");
        current.readLine(onRead);
      }
    }
    current.readLine(onRead);
  }
}));

window.addEventListener('load', function() {
  document.documentElement.addEventListener('keydown', function(){
    document.querySelector("#inputbox").focus();
  });

  var env={
    PATH:"/bin/;.",
    HOME:"/home/",
    WORKING_DIRECTORY:"/home/"
  };

  var stdout=VFS.open("/dev/stdout");
  stdout
      .write("Gary Guo <gary@garyguo.net>\nCopyright (c) 2014 - 2018, Gary Guo. All rights reserved.\n");
  function createBash(){
    VFS
        .open("/bin/bash")
        .exec(
            env,
            ["/bin/bash"],
            function(){
              window.close();
              stdout
                  .write("Permission Denied: You browser does not allow the window to be closed.\n");
              createBash();
            });
  }
  createBash();
});