(function(VFS, wrapCLib) {
  var guide = function(lib, args, callback) {
    lib.puts("Welcome to Gary's Personal Home Page.\n");
    lib.puts("This homepage is a simulation of Unix terminal. You may use a command by typing it and hit enter.\n");
    lib.puts("If you just want to see my resume, simply use command 'me'\n");
    callback();
  }
  VFS.open("/home/guide", true).write(wrapCLib(guide));
})(VFS, wrapCLib);

(function(VFS, wrapCLib) {
  var projects = [
    'Stable Projects', ["", 'Encoding', 'A whatwg encoding specification conformant encoding library in Javascript'],
    ["", 'norlit-libc', 'A C11 specification conformant library implementation from scratch'],
    ["", 'XRMI', 'Java networking library for smarter remote method invocation'],
    ["http://nbdd0121.github.io/JSMinifier", 'JSMinifier', 'ES5 Minifier and obfuscator'],
    ["http://nbdd0121.github.io/MUNRecorder", 'MUNRecorder', 'Model United Nations conference organizer'],
    ["http://nbdd0121.github.com/SATVocab", 'SATVocab', 'A tool helps Chinese students recite SAT vocabularies'],
    'Some Old & Discontinued Works', ["", 'NorlitOS', '32-bit operating system project'],
    ["", 'SakiOS', 'Bootloader Environment'],
    ["", 'NodokaJS', 'Javascript runtime project'],
    'Some Interesting Stuff', ['', 'ELFSharedLibrary', 'A ELF shared library loader that works on Windows (32-bit only)'],
    ['', 'GenerationalGC', 'Generational garbage collector for C++'],
    ['', 'PreprocessingArt', 'Preprocessor tricks'],
    ['', 'CppCoroutine', 'Single-thread corountine support for C++'],
    'AIs Made in Summer School', ['', 'Tsuro', 'Tsuro game and a naive AI implementation'],
    ["https://github.com/Vadman97/ChessGame", 'ChessGame', 'Chess game with AI developed by Vadim Korolik ad me'],
    ["", 'Creepy2048', '2048 with AI and with different difficulties'],
    'Scratch Works', ["", 'make.js', 'Makefile substitute written using Node.js'],
    ['', 'JS-Text-Preprocessor', 'JavaScript-powered servlet page'],
    ['', 'Norlit-IDE', 'A node-webkit & ace powered editor'],
    'MediaWiki Extensions', ['https://github.com/nbdd0121/MW-FlowThread', 'FlowThread', 'Comment posting extension for MediaWiki'],
    ['https://github.com/nbdd0121/MW-Avatar', 'Avatar', 'Avatar system that allows client-side avatar resampling & clipping'],
    ['https://github.com/nbdd0121/MW-PageRating', 'PageRating', 'Simple rating widget that allows you to rate a page using 1-5 stars'],
  ];

  var guide = function(lib, args, callback) {
    lib.puts('\033[2m');
    lib.puts('<b>== Personal Information ==</b>\n');
    lib.puts('Name: Xuan Guo\n');
    lib.puts('Preferred Name: Gary\n')
    lib.puts('Date of Birth: Jan 21st, 1998\n');
    lib.puts('Hobbies: Programming, Surfing on MediaWikis and Watching Animes.\n\n');

    lib.puts('<b>== Education ==</b>\n');
    lib.puts('High school: <a href="http://www.nwgjb.com/en/index.aspx" target="_blank">Ningbo Foreign Language School</a>\n');
    lib.puts('Undergraduate [ONGOING]: <a href="http://www.cam.ac.uk" target="_blank">University of Cambridge</a>\n\n');
    lib.puts('<b>== Computer Science Skills ==</b>\n');
    lib.puts('  C/C++ Programming Language[========= ]\n  Java Programming Language [========= ]\n  Web Development           [========  ]\n  Data Structure            [=======   ]\n  Compiling Theory          [=====     ]\n  Operating System Theory   [=======   ]\n  Artificial Intelligence   [==        ]\n  Linux and Unix            [====      ]\n');
    lib.puts('<b>== What I like to do ==<b>\n')
    lib.puts('  * Reading specifications (ex. C11 specification)\n');
    lib.puts('  * Reinventing wheels (see my projects)\n');
    lib.puts('  * Compiler theories and operating system theories\n');
    lib.puts('  * Code using <del>JavaScript</del> ECMAScript (I like to use HTML + JavaScript to construcct web applications instead of native apps)\n');

    lib.puts('<b>== My Projects ==</b>\n');
    for (var i = 0; i < projects.length; i++) {
      var item = projects[i];
      if (typeof(item) === 'string') {
        lib.puts('<b>' + item + '</b>\n');
        continue;
      }
      if (!item[0]) {
        item[0] = 'https://github.com/nbdd0121/' + item[1];
      }
      lib.puts('&nbsp;&nbsp;<a href="' + item[0] + '" target="_blank">' + item[1] + '</a> ' + item[2] + '\n');
    }

    lib.puts('\n<b>== Side Links ==</b>\n');
    lib.puts('<a href="http://www.clang.pub/wiki/C11">clang.pub</a> [CHINESE] A MediaWiki website for C11 specification translation. I am a administrator and a translator of this site.\n');
    lib.puts('<a href="http://blog.csdn.net/nbdd0121">My CSDN Blog</a> [CHINESE] Blog posts about OS development written in high school. No longer updated.\n');
    lib.puts('<a href="http://nbdd0121.github.io">My Github Pages</a> It is this site!\n');
    lib.puts('\033[0m');
    callback();
  }
  VFS.open("/home/me", true).write(wrapCLib(guide));
})(VFS, wrapCLib);