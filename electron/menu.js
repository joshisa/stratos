const {
  app,
  Menu,
  BrowserWindow,
  autoUpdater
} = require('electron')

const fs = require('fs');
const path = require("path");

const isMac = process.platform === 'darwin'

let appMainWindow;
let appHomeUrl;

// Read version file
const versionFile = path.join(__dirname, `./version`);
let version = 'dev';
if (fs.existsSync(versionFile)) {
  version = fs.readFileSync(versionFile).toString();
}

function getMenu(mainWindow, homeUrl) {
  appMainWindow = mainWindow;
  appHomeUrl = homeUrl
  return template;
}

function about() {
  let child = new BrowserWindow({
    parent: appMainWindow,
    modal: true,
    width: 360,
    height: 300,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });
  child.stratosVersion = version;
  child.loadFile('about.html');
  //child.webContents.openDevTools({mode:'undocked'});
}

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: 'Stratos',
    submenu: [{
        label: 'About Stratos',
        click: function () {
          about();
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'services'
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'Check for Updates',
        click: function () {
          autoUpdater.checkForUpdates();
        }
      },
      {
        type: 'separator'
      },
      isMac ? {
        role: 'close'
      } : {
        role: 'quit'
      }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [{
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      ...(isMac ? [{
          role: 'pasteAndMatchStyle'
        },
        {
          role: 'delete'
        },
        {
          role: 'selectAll'
        },
        {
          type: 'separator'
        },
        // {
        //   label: 'Speech',
        //   submenu: [
        //     { role: 'startspeaking' },
        //     { role: 'stopspeaking' }
        //   ]
        // }
      ] : [{
          role: 'delete'
        },
        {
          type: 'separator'
        },
        {
          role: 'selectAll'
        }
      ]),
      {
        label: 'Settings',
        click(menuItem, browserWindow, event) {
          const url = `${appHomeUrl}/desktop-settings`
          browserWindow.loadURL(url)
        }
      }
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [{
        role: 'reload'
      },
      {
        role: 'forcereload'
      },
      {
        role: 'toggledevtools'
      },
      {
        type: 'separator'
      },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin'
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [{
        role: 'minimize'
      },
      {
        role: 'zoom'
      },
      ...(isMac ? [{
          type: 'separator'
        },
        {
          role: 'front'
        },
        {
          type: 'separator'
        },
        {
          role: 'window'
        }
      ] : [{
        role: 'close'
      }])
    ]
  },
  {
    role: 'help',
    submenu: [{
      label: 'Learn More',
      click: async () => {
        const {
          shell
        } = require('electron')
        await shell.openExternal('https://electronjs.org')
      }
    }]
  }
]

module.exports = getMenu;
