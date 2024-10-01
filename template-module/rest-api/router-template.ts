import { ApplicationRouter } from "../../application";

import { $entityNameController } from "./$moduleName-controller";

export default class $entityNameRouter extends ApplicationRouter {
  configure(): void {
    const { router } = this;
    const ctrl = new $entityNameController();

    // Define get routes
    router.get("/", ctrl.get$entityName);
    router.get("/:id", ctrl.get$entityNameById);

    // Define post routes here
    router.post("/", ctrl.create$entityName);
    router.put("/:id", ctrl.update$entityName);
    router.delete("/:id", ctrl.delete$entityName);
  }
}
