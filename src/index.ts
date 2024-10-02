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
  defaults?: {
    filepaths?: { [key: string]: string };
    value?: { [key: string]: string };
  };
}

interface Template {
  configs?: Configs;
  variables: {
    filepaths?: string[];
    value?: string[];
  };
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
      : path.resolve(process.cwd(), file.filePath);
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

// Function to load file content for variables under 'filepaths', with templatesDir support
async function loadFilePathVariable(
  variable: string,
  templatesDir?: string,
  defaultPath?: string
): Promise<string> {
  // Prompt the user for file path, use defaultPath as the suggested default
  const answers = await prompt({
    type: "input",
    name: "filePath",
    message: `Please provide a file path for ${variable}:`,
    default: defaultPath, // Provide the default path as a suggestion
  });

  const resolvedPath = templatesDir
    ? path.resolve(templatesDir, answers.filePath)
    : path.resolve(process.cwd(), answers.filePath);

  if (fs.existsSync(resolvedPath)) {
    return fs.readFileSync(resolvedPath, "utf8");
  }
  console.error(`File not found at path: ${resolvedPath}`);
  process.exit(1);
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
  const filepathsDefaults = template.configs?.defaults?.filepaths || {};
  const valueDefaults = template.configs?.defaults?.value || {};

  // Collect variable values from the user, handling both 'filepaths' and 'value' sections
  const filePathVariables = template.variables.filepaths || [];
  const valueVariables = template.variables.value || [];

  // For 'filepaths', prompt the user for a file path, even if a default is provided
  const filePathVariableValues: { [key: string]: string } = {};
  for (const filePathVar of filePathVariables) {
    const fileContent = await loadFilePathVariable(
      filePathVar,
      templatesDir,
      filepathsDefaults[filePathVar]
    );
    filePathVariableValues[filePathVar] = fileContent;
  }

  // For 'value' variables, prompt the user to provide values or use defaults
  const valuePrompts = valueVariables.map((variable) => ({
    type: "input",
    name: variable,
    message: `Please provide a value for ${variable}:`,
    default: valueDefaults[variable], // Use the default value if available
  }));

  const valueVariableValues = await prompt(valuePrompts);

  // Combine both file path and value-based variables
  const variables = { ...filePathVariableValues, ...valueVariableValues };

  // Create folders and files based on the template and provided variables
  template.folders.forEach((folder) => {
    createFoldersAndFiles(folder, rootDir, variables, templatesDir);
  });

  console.log(`Module generation complete in directory: ${rootDir}`);
}

generateModule();
