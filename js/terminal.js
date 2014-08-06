(function(window, $){
	var root={
		__path:""
	};
	root.__parent=root;
	var term={};
	
	term.stdout={
		color:'class="color37 color40"',
		write:function write(data){
			var that=this;
			function genCode(str){
				var seq=str.split("\033[");
				var ret;
				if(seq[0]){
					ret=$('<span '+term.stdout.color+'>');
					ret.text(seq[0]);
				}else{
					ret=$();
				}
				for(var seqNum=1;seqNum<seq.length;seqNum++){
					var txt=seq[seqNum];
					var realTextBegin=txt.indexOf("m");
					var colorCode=txt.substr(0, realTextBegin).split(";");
					if(colorCode=="0"){
						term.stdout.color='class="color37 color40"';
					}else{
						term.stdout.color='class="color'+colorCode[1]+' color'+colorCode[2]+'"';
					}
					var jq=$('<span '+term.stdout.color+'>');
					jq.text(txt.substr(realTextBegin+1));
					ret=ret.add(jq);
				}
				return ret;
			}
			var datas=data.split("\n");
			$("p:last-child").append(genCode(datas[0]));
			for(var lineNum=1;lineNum<datas.length;lineNum++){
				var line=datas[lineNum];
				var prevp=$("p:last-child");
				if(prevp.text()=="")prevp.html("&nbsp;");
				$("body").append("<p>");
				$("p:last-child").append(genCode(line));
			}
		}
	};
	
	term.stdin={
		readLine:function readLine(callback, funckey){
			function adjustWidth(input){
				input.width($("body").width()-input.offset().left);
			}
			var input=$('<input id="inputbox" '+term.stdout.color+' spellcheck=false />');
			$("p:last-child").append(input);
			adjustWidth(input);
			input.focus();
			input.keypress(function(e){
				if(e.which==13){
					input.remove();
					term.stdout.write(input.val()+"\n");
					callback(input.val());
				}
			});
			input.keydown(function(e){
				switch(e.which){
				case 38:funckey&&funckey("up", input);break;
				case 40:funckey&&funckey("down", input);break;
				}
			});
		}
	};
	
	root.dev={
	    __parent:root,
	    __path:"/dev",
		stdout:{
			open:function open(){
				return term.stdout;
			}
		},
		stdin:{
			open:function open(){
				return term.stdin;
			}
		}
	};
	root.home={
		__parent:root,
		__path:"/home"
	};
	
	term.lookup=function lookup(fullpath){
		var path=fullpath.split("/");
		var currentPath=root;
		for(var i=1;i<path.length;i++){
			var subpath=path[i];
			switch(subpath){
			case "":case ".":continue;
			case "..":currentPath=currentPath.__parent;continue;
			}
			currentPath=currentPath[subpath];
			if(currentPath==null)
				return null;
		}
		return currentPath;
	};
	
	term.open=function open(fullpath){
		return term.lookup(fullpath).open();
	};
	
	term.exec=function exec(fullpath, args, callback){
		return term.lookup(fullpath).exec(args, callback);
	};
	
	term.create=function create(path){
		path=path.split("/");
		var currentPath=root;
		for(var i=1;i<path.length;i++){
			if(!currentPath[path[i]]){
				var newFile={};
				newFile.__parent=currentPath;
				newFile.__path=currentPath.__path+"/"+path[i];
				currentPath[path[i]]=newFile;
			}
			currentPath=currentPath[path[i]];
		}
		return currentPath;
	};
	
	term.createExecFile=function createExecFile(file, path){
		var realFile=term.create(path);
		realFile.__type="exec";
		realFile.exec=file;
	};
	
	term.env={
		HOME:"/home/",
		PATH:"/bin/;;"
	}
	
	window.Root=root;
	window.Terminal=term;
})(window, jQuery);

$(window).load(function(){
	$("html").click(function(){
		$("#inputbox").focus();
	});
});

Terminal.createExecFile(function(args, callback){
	var stdout=Terminal.open("/dev/stdout");
	for(var i=1;i<args.length;i++){
		stdout.write(args[i]+" ");
	}
	stdout.write("\n");
	callback();
}, "/bin/echo");

Terminal.createExecFile(function(args, callback){
	$("body").html("<p>");
	callback();
}, "/bin/clear");

Terminal.createExecFile(function(args, callback){
	var stdout=Terminal.open("/dev/stdout");
	var stdin=Terminal.open("/dev/stdin");
	
	var path=Terminal.env.HOME;
	var history=[];
	var inputBackup;
	var id=0;
	
	var builtinFunc={
		exit:function exit(args, cbk){
			callback();
		},
		logout:function exit(args, cbk){
			callback();
		},
		cd:function cd(args, cbk){
			if(!args[1]){
				path=Terminal.env.HOME;
			}else{
				var cddest=args[1][0]=="/"?args[1]:path+args[1];
				var newPath=Terminal.lookup(cddest);
				if(newPath==null){
					stdout.write("No such file or directory called "+args[1]+"\n");
				}else if(newPath.__type){
					stdout.write(args[1]+" is not a directory\n");
				}else{
					path=newPath.__path+"/";
				}
			}
			cbk();
		},
		pwd:function pwd(args, cbk){
			stdout.write(path+"\n");
			cbk();
		},
		ls:function ls(args, cbk){
			var current=Terminal.lookup(path);
			for(var i in current){
				if(i.substr(0, 2)=="__")continue;
				stdout.write(i+" ");
			}
			stdout.write("\n");
			cbk();
		}
		
		
		
	};
	
	function parseInput(str, callback){
		str=str.split(" ");
		if(builtinFunc[str[0]] instanceof Function){
			builtinFunc[str[0]](str, callback);
			return;
		}
		if(str[0][0]=="/"){
			var file=Terminal.lookup(str[0]);
			if(file&&file.exec){
				file.exec(str, callback);
				return;
			}
			stdout.write(str[0]+" is not supported.\n");
			callback();
		}else{
			var pathsplit=Terminal.env.PATH.split(";");
			pathsplit.push(path);
			for(var i=0;i<pathsplit.length;i++){
				if(pathsplit[i]!=""){
					var file=Terminal.lookup(pathsplit[i]+str[0]);
					if(file&&file.exec){
						file.exec(str, callback);
						return;
					}
				}
			}
			stdout.write(str[0]+" is not supported.\n");
			callback();
		}
	}
	function readLineAndParse(){
		stdout.write("\033[1;40;34m"+(path==Terminal.env.HOME?"~":path)+" \033[1;40;31m$ \033[0m");
		stdin.readLine(function(val){
			history.push(val);
			id=history.length;
			if(history.length>20){
				history.splice(0, history.length-20);
				id=20;
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
	Terminal.stdout.write("Gary Guo <nbdd0121@hotmail.com>\nCopyright (c) 2014, Gary Guo. All rights reserved.\n");
	function createBash(){
		Terminal.exec("/bin/bash", "/bin/bash", function(){
			Terminal.stdout.write("Permission Denied: You cannot exit this session.\n");
			createBash();
		});
	}
	createBash();
});