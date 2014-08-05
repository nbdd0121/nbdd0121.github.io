(function(window, $){
	var root={};
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
				$("body").append("<p>");
				$("p:last-child").append(genCode(line));
			}
		}
	};
	
	term.stdin={
		readLine:function readLine(callback){
			function adjustWidth(input){
				input.width($("body").width()-input.offset().left);
			}
			var input=$('<input id="inputbox" '+term.stdout.color+'/>');
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
				case 38:alert("UP");break;
				case 40:alert("DOWN");break;
				}
			});
		}
	};
	
	root.dev={
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
	
	term.lookup=function lookup(fullpath){
		var path=fullpath.split("/");
		if(path[0]==""){
			var currentPath=root;
			for(var i=1;i<path.length;i++){
				currentPath=currentPath[path[i]];
				if(currentPath==null)
					return null;
			}
			return currentPath;
		}
	};
	
	term.open=function open(fullpath){
		return term.lookup(fullpath).open();
	};
	
	term.create=function create(path){
		path=path.split("/");
		var currentPath=root;
		for(var i=1;i<path.length;i++){
			if(!currentPath[path[i]]){
				currentPath[path[i]]={};
			}
			currentPath=currentPath[path[i]];
		}
		return currentPath;
	};
	
	term.createExecFile=function createExecFile(file, path){
		var realFile=term.create(path);
		realFile.exec=file;
	};
	
	window.Root=root;
	window.Terminal=term;
})(window, jQuery);

$(window).load(function(){
	$("html").click(function(){
		$("#inputbox").focus();
	});
});

Terminal.createExecFile(function(args){
	var stdout=Terminal.open("/dev/stdout");
	for(var i=1;i<args.length;i++){
		stdout.write(args[i]+" ");
	}
	stdout.write("\n");
}, "/bin/echo");

Terminal.createExecFile(function(args){
	$("body").html("<p>");
}, "/bin/clear");

$(window).load(function(){
	var stdout=Terminal.open("/dev/stdout");
	var stdin=Terminal.open("/dev/stdin");
	stdout.write("Gary Guo <nbdd0121@hotmail.com>\nCopyright (c) 2014, Gary Guo. All rights reserved.\n");
	var path="~";
	function parseInput(str){
		str=str.split(" ");
		var file=Terminal.lookup("/bin/"+str[0]);
		if(!file||!file.exec){
			stdout.write(str[0]+" is not supported.\n");
		}else{
			file.exec(str);
		}
	}
	function readLineAndParse(){
		stdout.write("\033[1;40;34m"+path+" \033[1;40;31m$ \033[0m");
		stdin.readLine(function(val){
			parseInput(val);
			readLineAndParse();
		});
	}
	readLineAndParse();
});