#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { prompt } from "inquirer";

// Define interfaces for the YAML structure
interface FileConfig {
  name: string;
  content?: string;
  filePath?: string;
}

interface FolderConfig {
  name?: string;
  files?: FileConfig[];
  folders?: FolderConfig[];
}

interface Configs {
  rootDir?: string;
  templatesDir?: string;
  defaults?: { [key: string]: string };
}

interface Template {
  configs?: Configs;
  variables: string[];
  folders: FolderConfig[];
}

// Function to replace placeholders in content
function replacePlaceholders(
  content: string,
  variables: { [key: string]: string }
): string {
  return Object.keys(variables).reduce((result, key) => {
    const regex = new RegExp(`\\$${key}`, "g");
    return result.replace(regex, variables[key]);
  }, content);
}

// Function to load content (either inline or from file)
function loadContent(file: FileConfig, templatesDir?: string): string {
  if (file.filePath) {
    const fullPath = templatesDir
      ? path.join(templatesDir, file.filePath)
      : path.resolve(process.cwd(), file.filePath); // Use process.cwd() to resolve the path
    try {
      const fileContent = fs.readFileSync(fullPath, "utf8");
      return fileContent;
    } catch (error) {
      console.error(`Error reading content from file path: ${fullPath}`);
      process.exit(1);
    }
  }
  return file.content || "";
}

// Function to create files in a folder
function createFiles(
  folderPath: string,
  files: FileConfig[],
  variables: { [key: string]: string },
  templatesDir?: string
): void {
  files.forEach((file) => {
    const fileName = replacePlaceholders(file.name, variables);

    const fileContent = replacePlaceholders(
      loadContent(file, templatesDir),
      variables
    );

    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, fileContent);
    console.log(`Created file: ${filePath}`);
  });
}

// Recursive function to create folders and files based on the YAML template
function createFoldersAndFiles(
  templateFolder: FolderConfig,
  basePath: string,
  variables: { [key: string]: string },
  templatesDir?: string
): void {
  if (templateFolder.name) {
    const folderName = replacePlaceholders(templateFolder.name, variables);
    const folderPath = path.join(basePath, folderName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }

    // Create files if present in this folder
    if (templateFolder.files) {
      createFiles(folderPath, templateFolder.files, variables, templatesDir);
    }

    // Recursively create nested folders
    if (templateFolder.folders) {
      templateFolder.folders.forEach((subFolder) => {
        createFoldersAndFiles(subFolder, folderPath, variables, templatesDir);
      });
    }
  } else if (templateFolder.files) {
    // Handle root-level or non-folder-specific files
    createFiles(basePath, templateFolder.files, variables, templatesDir);
  }
}

// Main function to run the module generator
async function generateModule(): Promise<void> {
  // Check if command like `add-module` or YAML file path is provided
  const commandOrFilePath = process.argv[2] || "./mgrc.yaml";
  let yamlFilePath: string;

  // If the command is `add-module`, default to ./mgrc.yaml, otherwise treat it as a file path
  if (commandOrFilePath === "add-module") {
    const customYamlFilePath = process.argv[3];

    yamlFilePath = path.resolve(
      process.cwd(),
      customYamlFilePath || "./mgrc.yaml"
    );
  } else {
    yamlFilePath = path.resolve(process.cwd(), commandOrFilePath);
  }

  // Read and parse YAML file
  let template: Template;
  try {
    const fileContent = fs.readFileSync(yamlFilePath, "utf8");
    template = parse(fileContent) as Template;
  } catch (error: any) {
    console.error(`Error reading or parsing YAML file: ${error.message}`);
    process.exit(1);
  }

  // Extract configs
  const rootDir = path.resolve(
    process.cwd(),
    template.configs?.rootDir || process.cwd()
  );
  const templatesDir = template.configs?.templatesDir
    ? path.resolve(process.cwd(), template.configs.templatesDir)
    : undefined;
  const defaultValues = template.configs?.defaults || {};

  // Collect variable values from the user, using defaults when available
  const variablePrompts = template.variables.map((variable) => ({
    type: "input",
    name: variable,
    message: `Please provide a value for ${variable}:`,
    default: defaultValues[variable], // Use the default value if available
  }));

  const variables = await prompt(variablePrompts);

  // Create folders and files based on the template and provided variables
  template.folders.forEach((folder) => {
    createFoldersAndFiles(folder, rootDir, variables, templatesDir);
  });

  console.log(`Module generation complete in directory: ${rootDir}`);
}

generateModule();
