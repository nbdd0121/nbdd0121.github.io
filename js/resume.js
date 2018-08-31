(function(VFS, wrapCLib) {
  var projects = [
    'Stable Projects', ["", 'Encoding', 'A whatwg encoding specification conforming encoding library in Javascript'],
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
    //['https://github.com/nbdd0121/MW-PageRating', 'PageRating', 'Simple rating widget that allows you to rate a page using 1-5 stars'],
  ];

  var guide = function(lib, args, callback) {
    var p = lib.puts.bind(lib);

    var verbose = args[1] == '--verbose';

    p('\033[2m');
    p('<b>== Personal Information ==</b>\n');
    p('Name: Xuan Guo, aka Gary\n');
    p('Date of Birth: Jan 21st, 1998\n');
    p('Email: <gary@garyguo.net>gary@garyguo.net</a>\n');
    p('GitHub: <a href="https://github.com/nbdd0121/" target="_blank">@nbdd0121</a>\n');
    p('Website: <a href="https://garyguo.net/" target="_blank">garyguo.net</a>\n')

    p('\n<b>== Education ==</b>\n');
    p('Undergraduate: <a href="http://www.cam.ac.uk" target="_blank">University of Cambridge</a> (2015-2018)\n');
    p('  Part IB Tripos: 1st Class Honor\n');
    p('  Part IA Tripos: 1st Class Honor\n');
    p('High school: <a href="http://www.nwgjb.com/en/index.aspx" target="_blank">Ningbo Foreign Language School</a> (2012-2015)\n');

    p('\n<b>== Skills ==</b>\n');
    p('Languages:\n')
    p('  Proficient: C/C++, Java, EMCAScript, PHP, SystemVerilog, Basic\n');
    p('  Familiar  : ML/Ocaml, Rust, Prolog, C#\n');
    p('  Basic     : Python, Scala, Bash, MATLAB\n');
    p('Other skills:\n')
    p('  Web Development (Proficient)\n');
    p('  Hardware Development (Familiar)\n');
    p('  Compiler Construction (Hobby, Familiar with parsing)\n');
    p('  Operating System Development (Hobby)\n');

    p('\n<b>== Awards ==</b>\n');

    if (verbose) {
      p('<b>High school:</b>\n');
      p('  Euclid Mathematics Contest 2013: Rank #6, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2013/2013EuclidResults.pdf">REF</a>]\n');
      p('  Euclid Mathematics Contest 2014: Rank #15, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2014/2014EuclidResults.pdf">REF</a>]\n');
      p('  Stanford Math Tournamant China 2014: Power Round Bronze Metal, Team Round #6, Overall Team #10. [<a href="http://sumo.stanford.edu/smt/2014-china/results.html">REF</a>]\n');
      p('  Wuxi National Model United Nations 2013: Outstanding Delegate.\n');
      p('<b>University:</b>\n');
    }

    p('  BCS Award for an Outstanding Second Year Student\n');
    p('  G-Research Prize for the Best Part IA Student\n');

    p('\n<b>== Working Experience ==</b>\n');
    p('Software Developer Intern, Best Internet Technology CO., LTD (2013 Summer)\n');
    p('* Best Internet Technology CO., LTD is a Chinese software solutions provider, mainly providing solution for its logisitics subsidiary.\n');
    p('* Researched on Chinese text tokenization, and developed a prototype capable of replying user queries by keyword extraction.\n')
    p('* Developed a web-based statistics viewer for custom service team.\n\n');
    p('SoC Developer Intern, lowRISC Project, University of Cambridge Computer Laboratory (2016 Summer)\n');
    p('* lowRISC is an open source project aiming to create a fully open-sourced, Linux-capable, RISC-V-based SoC.\n');
    p('* Implemented a VGA adapter for Digilent Nexys 4 DDR Artix-7 FPGA.\n');
    p('* Implemented a VGA driver for linux of the VGA adapter.\n');
    p('* Implemented AXI4 and AXI4-Lite BRAM controller to replace Xilinx\'s proprietary IP.\n');
    p('* Implemented AXI4-Stream data mover and infrastructres (including narrower, widener, mux, demux and crossbar).\n');
    p('* Implemented an AXI4-Stream based stream accelerator infrastructure.\n');
    p('* Implemented few AXI4-Stream based accelerators for MPEG2 decoding.\n');
    p('* Achieved 4x speed-up for video playback under RISC-V linux.\n');
    p('* Created detailed documentation of developed components and a tutorial of creating extensions.\n');  

    p('<span class="page-break"> </span>');

    p('\n<b>== Activities ==</b>\n');

    if (verbose) {
      p('<b>High school:</b>\n');
      p('  Technical Director, Model United Nations Society (2013-2014)\n');
      p('<b>University:</b>\n');
    }

    p('  Webmaster, Peterhouse JCR (2016)\n');
    p('  IT Officer, Cambridge University Chinese Culture Society (2016)\n');
    p('  Open Day Helper, Computer Laboratory, University of Cambridge (2016)\n');
    p('  * Demonstrate objective and goal of Part IA Java course\n');
    p('  Part IA Demonstrator, Computer Laboratory, University of Cambridge (2016)\n');
    p('  * Demonstrate ML programming language during Part IA ML help sessions\n');

    p('\n<b>== Hobbies and Interests ==<b>\n');
    p('  * Reading specifications (ex. C11 specification)\n');
    p('  * Reinventing wheels (see my projects)\n');
    p('  * Compiler theories and operating system theories\n');
    p('  * Surfing on MediaWiki sites\n');
    p('  * Watching animes and reading mangas\n');

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

    if (verbose) {
      p('\n<b>== Side Links ==</b>\n');
      p('<a href="http://www.clang.pub/wiki/C11">clang.pub</a> [CHINESE] A MediaWiki website for C11 specification translation. I am a administrator and a translator of this site.\n');
      p('<a href="http://blog.csdn.net/nbdd0121">My CSDN Blog</a> [CHINESE] Blog posts about OS development written in high school. No longer updated.\n');
    } else {
      p('\nMy high school experiences are hidden by default. To see these, execute with arguemnt --verbose.\n');
    }

    p('\033[0m');
    callback();
  }
  VFS.open("/home/me", 'application/javascript').write(wrapCLib(guide));
})(VFS, wrapCLib);
