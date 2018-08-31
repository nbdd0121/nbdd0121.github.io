(function(VFS){
  VFS.open("/home/MUNRecorder", 'application/javascript').write(function(){
    window.location="http://nbdd0121.github.io/MUNRecorder";
  });
  VFS.open("/home/SATVocab", 'application/javascript').write(function(){
    window.location="http://nbdd0121.github.io/SATVocab";
  });
  VFS.open("/home/JSMinifier", 'application/javascript').write(function(){
    window.location="http://nbdd0121.github.io/JSMinifier";
  });
})(VFS);
