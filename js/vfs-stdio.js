{
  // Global stdout states
  let paragraph;
  let inputbox;
  let classList = [];
  let escapeContent = true;

  // Process escape sequence and update globla states
  function parseEscape(seq) {
    let splits = seq.split(";");
    switch (splits[0]) {
      case "0":
        classList = [];
        escapeContent = true;
        break;
      case "1": {
        classList = [];
        for (let i = 1; i < splits.length; i++) {
          classList.push('color' + splits[i]);
        }
        break;
      }
      case "2": {
        color = [];
        escapeContent = false;
        break;
      }
    }
  }

  function appendWithoutNewline(str) {
    let first = true;
    for (let text of str.split('\x1b[')) {
      if (first) {
        first = false;
      } else {
        let escapeEnd = text.indexOf('m');
        parseEscape(text.substr(0, escapeEnd));
        text = text.substr(escapeEnd + 1);
      }
      let element = document.createElement('span');
      element.classList = classList;
      if (escapeContent) {
        element.textContent = text;
      } else {
        element.innerHTML = text;
      }
      paragraph.appendChild(element);
    }
  }

  function appendString(str) {
    // Update element
    let allParagraphs = document.querySelectorAll('body>div');
    paragraph = allParagraphs[allParagraphs.length - 1];

    let first = true;
    for (let line of str.split('\n')) {
      if (first) {
        first = false;
      } else {
        paragraph = document.createElement('div');
        document.body.appendChild(paragraph);
      }
      appendWithoutNewline(line);
    }
  }

  function adjustWidth() {
    inputbox.style.width = document.body.clientWidth - inputbox.offsetLeft + 'px';
  }

  class TtyNode extends VFS.FileNode {
    constructor() {
      super('', 'char', 0o666, 0);
    }

    doRead(_offset, buffer) {
      return new Promise((resolve, _reject) => {
        let initialValue = '';
        if (inputbox) {
          inputbox.remove();
          initialValue = inputbox.value;
        }

        inputbox = document.createElement('input');
        inputbox.id = 'inputbox';
        inputbox.value = initialValue;
        inputbox.className = classList;
        inputbox.spellcheck = false;

        // Update paragraph
        let allParagraphs = document.querySelectorAll('body>div');
        paragraph = allParagraphs[allParagraphs.length - 1];

        paragraph.append(inputbox);
        adjustWidth();
        inputbox.focus();
        inputbox.addEventListener('keydown', (e) => {
          if (e.key === 'd' && e.ctrlKey) {
            // Ctrl + D
            e.preventDefault();
            if (inputbox.value == '') {
              resolve(0);
            }
          }
        });

        inputbox.addEventListener('keypress', (e) => {
          if (e.key == 'Enter') {
            inputbox.remove();
            let value = inputbox.value + '\n';
            inputbox = null;
            appendString(value);
            let encoded = new TextEncoder('utf-8').encode(value);
            buffer.set(encoded);
            resolve(encoded.length);
          } else if (e.key == 'Tab') {
            e.preventDefault();
          }
        });
      });
    }

    doWrite(_offset, buffer) {
      appendString(new TextDecoder('utf-8').decode(buffer));
      return buffer.length;
    }
  }

  document.documentElement.addEventListener('keydown', () => {
    let inputbox = document.getElementById('inputbox');
    if (inputbox) inputbox.focus();
  });

  VFS.tty = new TtyNode();

  enqueueTask(async () => {
    await VFS.mkdir('/dev');
    (await VFS.lookup('/dev/stdout', 'char')).mount(VFS.tty);
    (await VFS.lookup('/dev/stdin', 'char')).mount(VFS.tty);
  });
}
