import $entityNameRepository from "./store/$moduleName-repository";
import { $entityName } from "../types";

export default class $entityNameReader {
  public static get$entityName(): Promise<$entityName[]> {
    return $entityNameRepository.find().limit($pageLimit);
  }
}
