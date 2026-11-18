import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";
import project from './project.config.json';

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (existsSync(chrome)) Config.setBrowserExecutable(chrome);
Config.setVideoImageFormat('png');
Config.setCrf(project.export.crf);
Config.setDelayRenderTimeoutInMilliseconds(project.export.frameTimeoutMs);
Config.setOverwriteOutput(true);
