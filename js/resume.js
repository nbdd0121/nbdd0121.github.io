async function main(_env, args, lib) {
  let projects = [
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

  let verbose = args[1] == '--verbose';

  await lib.puts(`\x1b[2m
<b>== Personal Information ==</b>
Name: Xuan Guo, aka Gary
Date of Birth: Jan 21st, 1998
Email: <gary@garyguo.net>gary@garyguo.net</a>
GitHub: <a href="https://github.com/nbdd0121/" target="_blank">@nbdd0121</a>
Website: <a href="https://garyguo.net/" target="_blank">garyguo.net</a>

<b>== Education ==</b>
Undergraduate: <a href="http://www.cam.ac.uk" target="_blank">University of Cambridge</a> (2015-2018)
  Part IB Tripos: 1st Class Honor
  Part IA Tripos: 1st Class Honor
High school: <a href="http://www.nwgjb.com/en/index.aspx" target="_blank">Ningbo Foreign Language School</a> (2012-2015)

<b>== Skills ==</b>
Languages:
  Proficient: C/C++, Java, EMCAScript, PHP, SystemVerilog, Basic
  Familiar  : ML/Ocaml, Rust, Prolog, C#
  Basic     : Python, Scala, Bash, MATLAB
Other skills:
  Web Development (Proficient)
  Hardware Development (Familiar)
  Compiler Construction (Hobby, Familiar with parsing)
  Operating System Development (Hobby)

<b>== Awards ==</b>
`);

  if (verbose) {
    await lib.puts(`<b>High school:</b>
  Euclid Mathematics Contest 2013: Rank #6, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2013/2013EuclidResults.pdf">REF</a>]
  Euclid Mathematics Contest 2014: Rank #15, Best in School. [<a href="https://cemc.math.uwaterloo.ca/contests/past_contests/2014/2014EuclidResults.pdf">REF</a>]
  Stanford Math Tournamant China 2014: Power Round Bronze Metal, Team Round #6, Overall Team #10. [<a href="http://sumo.stanford.edu/smt/2014-china/results.html">REF</a>]
  Wuxi National Model United Nations 2013: Outstanding Delegate.
<b>University:</b>
`);
  }

  await lib.puts(`  BCS Award for an Outstanding Second Year Student
  G-Research Prize for the Best Part IA Student

<b>== Working Experience ==</b>
Software Developer Intern, Best Internet Technology CO., LTD (2013 Summer)
* Best Internet Technology CO., LTD is a Chinese software solutions provider, mainly providing solution for its logisitics subsidiary.
* Researched on Chinese text tokenization, and developed a prototype capable of replying user queries by keyword extraction.
* Developed a web-based statistics viewer for custom service team.

SoC Developer Intern, lowRISC Project, University of Cambridge Computer Laboratory (2016 Summer)
* lowRISC is an open source project aiming to create a fully open-sourced, Linux-capable, RISC-V-based SoC.
* Implemented a VGA adapter for Digilent Nexys 4 DDR Artix-7 FPGA.
* Implemented a VGA driver for linux of the VGA adapter.
* Implemented AXI4 and AXI4-Lite BRAM controller to replace Xilinx\'s proprietary IP.
* Implemented AXI4-Stream data mover and infrastructres (including narrower, widener, mux, demux and crossbar).
* Implemented an AXI4-Stream based stream accelerator infrastructure.
* Implemented few AXI4-Stream based accelerators for MPEG2 decoding.
* Achieved 4x speed-up for video playback under RISC-V linux.
* Created detailed documentation of developed components and a tutorial of creating extensions.

<b>== Activities ==</b>
`);

  if (verbose) {
    await lib.puts(`<b>High school:</b>
  Technical Director, Model United Nations Society (2013-2014)
<b>University:</b>
`);
  }

  await lib.puts(`  Webmaster, Peterhouse JCR (2016)
  IT Officer, Cambridge University Chinese Culture Society (2016)
  Open Day Helper, Computer Laboratory, University of Cambridge (2016)
  * Demonstrate objective and goal of Part IA Java course
  Part IA Demonstrator, Computer Laboratory, University of Cambridge (2016)
  * Demonstrate ML programming language during Part IA ML help sessions

<b>== Hobbies and Interests ==<b>
  * Reading specifications (ex. C11 specification)
  * Reinventing wheels (see my projects)
  * Compiler theories and operating system theories
  * Surfing on MediaWiki sites
  * Watching animes and reading mangas

<b>== Projects ==</b>
`);

  for (let item of projects) {
    if (typeof item === 'string') {
      await lib.puts('<b>' + item + '</b>\n');
      continue;
    }
    if (!item[0]) {
      item[0] = 'https://github.com/nbdd0121/' + item[1];
    }
    await lib.puts('&nbsp;&nbsp;<a href="' + item[0] + '" target="_blank">' + item[1] + '</a> ' + item[2] + '\n');
  }

  if (verbose) {
    await lib.puts(`
<b>== Side Links ==</b>
<a href="http://www.clang.pub/wiki/C11">clang.pub</a> [CHINESE] A MediaWiki website for C11 specification translation. I am a administrator and a translator of this site.
<a href="http://blog.csdn.net/nbdd0121">My CSDN Blog</a> [CHINESE] Blog posts about OS development written in high school. No longer updated.
`);
  } else {
    await lib.puts('\nMy high school experiences are hidden by default. To see these, execute with arguemnt --verbose.\n');
  }

  await lib.puts('\x1b[0m');
}
