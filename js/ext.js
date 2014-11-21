(function(VFS){
  VFS.open("/home/MUNRecorder", true).write(function(){
    window.location="http://nbdd0121.github.io/MUNRecorder";
  });
  VFS.open("/home/SATVocab", true).write(function(){
    window.location="http://nbdd0121.github.io/SATVocab";
  });
  VFS.open("/home/JSMinifier", true).write(function(){
    window.location="http://nbdd0121.github.io/JSMinifier";
  });
})(VFS);
