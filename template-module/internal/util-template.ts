import { $entityName } from "../types";

import { $entityNameDB } from "./store/$moduleName-db";

export default class $entityNameUtil {
  public static convert$entityNameDBTo$entityName(
    $moduleNameDb: $entityNameDB
  ): $entityName {
    const task = new $entityName();

    return task;
  }
}
