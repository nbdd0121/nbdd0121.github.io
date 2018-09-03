async function main(env, args, lib) {
    if (args.length < 2) {
        return lib.puts('markdown: no input files\n');
    }
    let file = await lib.fopen(args[1]);
    if (file === null) {
        return lib.puts(`markdown: ${args[1]}: no such file or directory\n`);
    } else if (file.isDirectory()) {
        return lib.puts(`markdown: ${args[1]}: Is a directory\n`);
    }

    await includeScript('https://cdn.jsdelivr.net/npm/markdown-it@8.4.2/dist/markdown-it.min.js', 'sha256-JdPG0DllQPmyIeUeYRUCvk6K3tY7C7RZyVKEcT56yzQ=');

    let content = await file.readAll('string');
    let result = window.markdownit().render(content);

    var div = document.createElement('div');
    div.innerHTML = result;
    div.className = 'markdown';
    document.body.appendChild(div);
    document.body.appendChild(document.createElement('div'));

    await includeStylesheet('css/markdown.css');
}
