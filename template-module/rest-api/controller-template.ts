import { applicationController, Request, Response } from "../../application";
import { HttpStatusCodes } from "../../http";
import $entityNameService from "../$moduleName-service";

import { serialize$entityNameAsJSON } from "./$moduleName-serializer";

export class $entityNameController {
  get$entityName = applicationController(
    async (req: Request, res: Response) => {
      res
        .status(HttpStatusCodes.OK)
        .send(serialize$entityNameAsJSON($entityNameService.get$entityName()));
    }
  );
}
