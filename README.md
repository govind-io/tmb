
# tmb - Template Module Builder

`tmb` is a powerful CLI tool that allows you to define template modules and generate them using YAML configuration files. It's ideal for projects where you need consistent module generation based on pre-defined templates.

## Installation

You can install `tmb` as a dev dependency:

```bash
npm install @govindgovind852/tmb --save-dev
```

## Usage

After installation, you can use the CLI tool by running:

```bash
npx @govindgovind852/tmb add-module [yaml-file-path]
```

or

add this in your package script

```bash
"tmb": "tmb add-module [yaml-file-path]"
```

If no file path is provided, the default `./mgrc.yaml` will be used.

### Example

Here’s an example YAML configuration to generate a module with folders and files:

```yaml
configs:
  rootDir: "./src/modules"
  templatesDir: "./template-module"
  defaults:
    filepaths:
      dbTypeDef: "dbTypeDef.ts"
      entityTypeDef: "entityTypeDef.ts"
      dbSchema: "dbSchema.ts"
    value:
      moduleName: "test"
      entityName: "Test"
      pageLimit: "10"
variables:
  filepaths:
    - dbTypeDef
    - entityTypeDef
    - dbSchema
  value:
    - moduleName
    - entityName
    - pageLimit
folders:
  - name: $moduleName
    folders:
      - name: internals
        folders:
          - name: store
            files:
              - name: $moduleName-db.ts
                filePath: "internal/store/db-template.ts"
              - name: $moduleName-repository.ts
                filePath: "internal/store/repository-template.ts"
        files:
          - name: $moduleName-writer.ts
            filePath: "internal/writer-template.ts"
          - name: $moduleName-reader.ts
            filePath: "internal/reader-template.ts"
          - name: $moduleName-util.ts
            filePath: "internal/util-template.ts"
      - name: rest-api
        files:
          - name: $moduleName-controller.ts
            filePath: "rest-api/controller-template.ts"
          - name: $moduleName-router.ts
            filePath: "rest-api/router-template.ts"
          - name: $moduleName-serializer.ts
            filePath: "rest-api/serializer-template.ts"
          - name: $moduleName-server.ts
            filePath: "rest-api/server-template.ts"
      - files:
          - name: service.ts
            filePath: "service-template.ts"
          - name: index.ts
            filePath: "index-template.ts"
          - name: types.ts
            filePath: "types-template.ts"
```

### Configuration Options

#### `configs`

- **rootDir**: Specifies where the generated modules will be created. Defaults to the current directory if not specified.
- **templatesDir**: Specifies the folder where your template files are stored. If not provided, you can specify inline content or use absolute paths for templates.
- **defaults**: You can specify default values for variables like `moduleName`.

#### `variables`

A list of variables that will be replaced in folder and file names, and within file contents. The user is prompted to provide these unless defaults are given.

#### `folders`

Defines the folder structure for the module. It contains:

- **name**: The folder name (can include variables like `$moduleName`).
- **folders**: Subfolders inside the folder.
- **files**: Files inside the folder.

#### `files`

Each folder can have multiple files. Files can specify:

- **name**: The file name, which can contain variables like `$moduleName`.
- **filePath**: Path to an external template file.
- **content**: Inline content directly provided in the YAML file.

### Development

For development, you can run the following command to test the module generation without building:

```bash
npm run dev
```

To build the package for distribution:

```bash
npm run build
```

### License

`tmb` is licensed under the MIT License.
