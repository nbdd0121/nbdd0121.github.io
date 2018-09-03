enqueueTask(async () => {
  await (await VFS.open("/home/MUNRecorder", 'file')).writeAll(function () {
    window.location = "http://nbdd0121.github.io/MUNRecorder";
  });
  await (await VFS.open("/home/SATVocab", 'file')).writeAll(function () {
    window.location = "http://nbdd0121.github.io/SATVocab";
  });
  await (await VFS.open("/home/JSMinifier", 'file')).writeAll(function () {
    window.location = "http://nbdd0121.github.io/JSMinifier";
  });
  await VFS.load('/home/me', 'js/resume.js');
});
