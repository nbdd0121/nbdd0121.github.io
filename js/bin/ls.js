async function main(env, args, lib) {
  let file = args[1] || "";
  await lib.chdir(file);
  let dir = await (await lib.fopen('.')).list();
  for (let item of dir) {
    var stat = await lib.stat(item);
    switch (stat.type) {
      case 'dir':
        await lib.puts("\x1b[1;34m" + item + "\x1b[0m  ");
        break;
      case 'char':
        await lib.puts("\x1b[1;33m" + item + "\x1b[0m  ");
        break;
      default:
        if (stat.exec) {
          await lib.puts("\x1b[1;32m" + item + "\x1b[0m  ");
        } else {
          await lib.puts(item + "  ");
        }
        break;
    }
  }
  return lib.puts("\n");
}
