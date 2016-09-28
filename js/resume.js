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
	var p = lib.puts.bind(lib);

    p('\033[2m');
    p('<b>== Personal Information ==</b>\n');
    p('Name: Xuan Guo\n');
    p('Preferred Name: Gary\n')
    p('Date of Birth: Jan 21st, 1998\n');
    p('Hobbies: Programming, Surfing on MediaWikis and Watching Animes.\n');

    p('\n<b>== Education ==</b>\n');
    p('High school: <a href="http://www.nwgjb.com/en/index.aspx" target="_blank">Ningbo Foreign Language School</a>\n');
    p('Undergraduate [Second Year Currently]: <a href="http://www.cam.ac.uk" target="_blank">University of Cambridge</a>\n');

    p('\n<b>== Working Experience ==</b>\n');
    p('Software Developer Intern, Best Internet Technology CO., LTD (2013 Summer)\n');
    p('  Best Internet Technology CO., LTD is a Chinese software solutions provider, mainly providing solution for its logisitics subsidiary.\n');
    p('SoC Developer Intern, lowRISC Project, University of Cambridge Computer Laboratory (2016 Summer)\n');
    p('  lowRISC is an open source project aiming to create a fully open-sourced, Linux-capable, RISC-V-based SoC. The internship focuses on extending the SoC based on current design. We have implemented VGA output and a custom stream-based accelerator.\n');

    p('\n<b>== Voluntary Work ==</b>\n');
    p('<b>High school:</b>\n');
    p('  Technical Director, Model United Nations Society (2013-2014)\n');
    p('<b>University:</b>\n');
    p('  Webmaster, Peterhouse JCR (2016)\n');
    p('  IT Officer, Cambridge University Chinese Culture Society (2016)\n');

    p('\n<b>== Awards ==</b>\n');
    p('<b>High school:</b>\n');
    p('  Euclid Mathematics Contest 2013: Rank #6, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2013/2013EuclidResults.pdf">REF</a>]\n');
    p('  Euclid Mathematics Contest 2014: Rank #15, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2014/2014EuclidResults.pdf">REF</a>]\n');
    p('  Stanford Math Tournamant China 2014: Power Round Bronze Metal, Team Round #6, Overall Team #10. [<a href="http://sumo.stanford.edu/smt/2014-china/results.html">REF</a>]\n');
    p('  Wuxi National Model United Nations 2013: Outstanding Delegate.\n');
    p('<b>University:</b>\n');
    p('  Bloomberg Codecon 2015: UK Final\n');
    p('  G-Research Prize for Best Part IA Student. [<a href="https://www.cl.cam.ac.uk/supporters-club/studentprizes/">DESC</a>, <a href="http://www.cl.cam.ac.uk/downloads/ring/ring-2016-09.pdf">REF</a>]\n');

    p('\n<b>== Skills ==</b>\n');
    p('  C/C++ Programming Language [========= ]\n');
    p('  Java Programming Language  [========= ]\n');
    p('  Web Development            [========  ]\n');
    p('  Data Structure             [=======   ]\n');
    p('  Compiler Theory            [====      ]\n');
    p('  Operating System Theory    [======    ]\n');
    p('  Artificial Intelligence    [==        ]\n');
    p('  Linux and Unix             [=====     ]\n');
    p('  Hardware Development       [=====     ]\n');

    p('\n<b>== What I Like ==<b>\n')
    p('  * Reading specifications (ex. C11 specification)\n');
    p('  * Reinventing wheels (see my projects)\n');
    p('  * Compiler theories and operating system theories\n');
    p('  * Code using <del>JavaScript</del> ECMAScript (I like to use HTML + JavaScript to construct web applications instead of native apps)\n');

    p('\n<b>== Projects ==</b>\n');
    for (var i = 0; i < projects.length; i++) {
      var item = projects[i];
      if (typeof(item) === 'string') {
        p('<b>' + item + '</b>\n');
        continue;
      }
      if (!item[0]) {
        item[0] = 'https://github.com/nbdd0121/' + item[1];
      }
      p('&nbsp;&nbsp;<a href="' + item[0] + '" target="_blank">' + item[1] + '</a> ' + item[2] + '\n');
    }

    p('\n<b>== Side Links ==</b>\n');
    p('<a href="http://www.clang.pub/wiki/C11">clang.pub</a> [CHINESE] A MediaWiki website for C11 specification translation. I am a administrator and a translator of this site.\n');
    p('<a href="http://blog.csdn.net/nbdd0121">My CSDN Blog</a> [CHINESE] Blog posts about OS development written in high school. No longer updated.\n');
    p('<a href="http://www.nbdd0121.com">My Personal Website</a> It is this site!\n');
    p('\033[0m');
    callback();
  }
  VFS.open("/home/me", true).write(wrapCLib(guide));
})(VFS, wrapCLib);
