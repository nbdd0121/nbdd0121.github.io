(function(VFS, wrapCLib){
  var guide=function(lib, args, callback){
    lib.puts("Welcome to Gary's Personal Home Page.\n");
    lib.puts("This homepage is a simulation of Unix terminal. You may use a command by typing it and hit enter.\n");
    lib.puts("If you just want to see my resume, simply use command 'me'\n");
    callback();
  }
  VFS.open("/home/guide", true).write(wrapCLib(guide));
})(VFS, wrapCLib);

(function(VFS, wrapCLib){
  var guide=function(lib, args, callback){
    lib.puts('Date of Birth: Jan 21st, 1998\nHigh school: \033[2m<a href="http://www.nwgjb.com/en/index.aspx" target="_blank">Ningbo Foreign Language School</a>\033[0m\nHobbies: Programming, Surfing on Wikipedia and Watching Animes.\nComputer Science skills that I mastered\n  C Programming Language    [========= ]\n  Java Programming Language [========= ]\n  Web Design                [========  ]\n  Data Structure            [=======   ]\n  Compiling Theory          [=====     ]\n  Operating System Theory   [=======   ]\n  Artificial Intelligence   [==        ]\n  Linux and Unix            [====      ]\n');
    lib.puts('Projects\n  \033[2m<a href="https://github.com/nbdd0121/SakiOS" target="_blank">SakiOS</a>\033[0m [ONGOING] Bootloader Environment\n  \033[2m<a href="https://github.com/nbdd0121/NodokaJS" target="_blank">NodokaJS</a>\033[0m [ONGOING] Javascript runtime project\n  \033[2m<a href="https://github.com/nbdd0121/make.js" target="_blank">make.js</a>\033[0m Makefile substitute written using Node.js\n  \033[2m<a href="http://nbdd0121.github.io/MUNRecorder" target="_blank">MUNRecorder</a>\033[0m Model United Nations conference organizer\n  \033[2m<a href="http://nbdd0121.github.com/SATVocab" target="_blank">SATVocab</a>\033[0m A tool helps Chinese students recite SAT vocabularies\n  \033[2m<a href="https://github.com/nbdd0121/Creepy2048" target="_blank">Creepy2048</a>\033[0m 2048 with AI and with different difficulties\n  \033[2m<a href="https://github.com/Vadman97/ChessGame" target="_blank">ChessGame</a>\033[0m Chess game with AI developed by Vadim Korolik ad me\n  \033[2m<a href="https://github.com/nbdd0121/XRMI" target="_blank">XRMI</a>\033[0m Java networking library for smarter remote method invocation\n  \033[2m<a href="http://nbdd0121.github.io/JSMinifier" target="_blank">JSMinifier</a>\033[0m Javascript Minifier and obfuscator\n');
    callback();
  }
  VFS.open("/home/me", true).write(wrapCLib(guide));
})(VFS, wrapCLib);
