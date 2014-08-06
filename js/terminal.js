VFS.lookup("/home/", true);
VFS.open("/home/welcome", true).write(function(env, args, callback){
	var stdout=VFS.open("/dev/stdout");
	stdout.write("Welcome to Gary's blog. This is the first post. You may think that this is a text file and you view it by type is name, however, you are wrong. This is a program, and it outputs these texts to the /dev/stdout\n");
	callback();
});

$(window).load(function(){
	$("html").click(function(){
		$("#inputbox").focus();
	});
});

VFS.open("/bin/echo", true).write(function(env, args, callback){
	var stdout=VFS.open("/dev/stdout");
	for(var i=1;i<args.length;i++){
		stdout.write(args[i]+" ");
	}
	stdout.write("\n");
	callback();
});

VFS.open("/bin/clear", true).write(function(env, args, callback){
	$("body").html("<p>");
	callback();
});

VFS.open("/bin/pwd", true).write(function(env, args, callback){
	VFS.open("/dev/stdout").write(env.WORKING_DIRECTORY+"\n");
	callback();
});

VFS.open("/bin/ls", true).write(function(env, args, callback){
	var stdout=VFS.open("/dev/stdout");
	var current=VFS.open(env.WORKING_DIRECTORY).list();
	for(var i=0;i<current.length;i++){
		stdout.write(current[i]+" ");
	}
	stdout.write("\n");
	callback();
});

VFS.open("/bin/bash", true).write(function(env, args, callback){
	var stdout=VFS.open("/dev/stdout");
	var stdin=VFS.open("/dev/stdin");
	
	var history=[];
	var inputBackup;
	var id=0;
	
	var builtinFunc={
		exit:function exit(env, args, cbk){
			callback();
		},
		logout:function exit(env, args, cbk){
			callback();
		},
		cd:function cd(env, args, cbk){
			if(!args[1]){
				env.WORKING_DIRECTORY="/home/"
			}else{
				var cddest=args[1][0]=="/"?args[1]:env.WORKING_DIRECTORY+args[1];
				var newPath=VFS.lookup(cddest);
				if(newPath==null){
					stdout.write("No such file or directory called "+args[1]+"\n");
				}else if(newPath.type!="dir"){
					stdout.write(args[1]+" is not a directory\n");
				}else{
					env.WORKING_DIRECTORY=newPath.path+"/";
				}
			}
			cbk();
		}
	};
	
	function parseInput(str, callback){
		str=str.split(" ");
		if(builtinFunc[str[0]] instanceof Function){
			builtinFunc[str[0]](env, str, callback);
			return;
		}
		if(str[0][0]=="/"){
			var file=VFS.open(str[0]);
			if(file&&file.canExec()){
				file.exec(env, str, callback);
				return;
			}
			stdout.write(str[0]+" is not supported.\n");
			callback();
		}else{
			var pathsplit=env.PATH.split(";");
			pathsplit.push(env.WORKING_DIRECTORY);
			for(var i=0;i<pathsplit.length;i++){
				if(pathsplit[i]!=""){
					var file=VFS.open(pathsplit[i]+str[0]);
					if(file&&file.canExec()){
						file.exec(env, str, callback);
						return;
					}
				}
			}
			stdout.write(str[0]+" is not supported.\n");
			callback();
		}
	}
	function readLineAndParse(){
		stdout.write("\033[1;40;34m"+(env.WORKING_DIRECTORY==env.HOME?"~":env.WORKING_DIRECTORY)+" \033[1;40;31m$ \033[0m");
		stdin.readLine(function(val){
			if(history[history.length-1]!=val){
				history.push(val);
				id=history.length;
				if(history.length>20){
					history.splice(0, history.length-20);
					id=20;
				}
			}
			parseInput(val, readLineAndParse);
		}, function(key, element){
			if(key=="up"){
				if(id==0)return;
				if(id==history.length)inputBackup=element.val();
				id--;
				element.val(history[id]);
			}else if(key=="down"){
				if(id==history.length)return;
				id++;
				if(id==history.length)
					element.val(inputBackup);
				else
					element.val(history[id]);
			}
		});
	}
	readLineAndParse();
}, "/bin/bash");

$(window).load(function(){
	var env={
		PATH:"/bin/;",
		HOME:"/home/",
		WORKING_DIRECTORY:"/home/"
	};
	
	var stdout=VFS.open("/dev/stdout");
	stdout.write("Gary Guo <nbdd0121@hotmail.com>\nCopyright (c) 2014, Gary Guo. All rights reserved.\n");
	function createBash(){
		VFS.open("/bin/bash").exec(env, ["/bin/bash"], function(){
			stdout.write("Permission Denied: You cannot exit this session.\n");
			createBash();
		});
	}
	createBash();
});