import fs from "fs";

export const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const checkIfFileExists = (filePath: string) => {
  return fs.existsSync(filePath);
};

export const nukeFolder = (folder: string) => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  ensureDir(folder);
};
