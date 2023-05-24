const express=require("express");
const targetController=require("../controller/target.controller")
const router=express.Router();

router.route("/api/targets")
    .get(targetController.getAllTargets)
    .post(targetController.createTarget);


router.route("/api/targets/:id")
    .get(targetController.getTargetById)
    .post(targetController.updateTargetMaxAttempts)


router.route("/route")
    .post(targetController.getDecision)
 

module.exports=router;