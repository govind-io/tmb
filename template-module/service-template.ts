import $entityNameReader from "./internal/$moduleName-reader";

import { $entityName } from "./types";

export default class $moduleNameService {
  public static get$entityName(): $entityName {
    return $entityNameReader.get$entityName();
  }
}