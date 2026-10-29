# H16 → H*: the height check accounts for an object hanging below the gripper

**Change.** `verify` and `done` checks for `lifted` / `height` on a held object used to read the height from the gripper pose. A microphone held off-centre hangs below the fingers, so the check passed while the object's lowest point was still too low, and `done` was accepted on a failed task. The check now moves the grasp-time point cloud with the current gripper pose and, for an off-centre grip, also allows for swing around the fingers. It can only turn a pass into "not confirmed" (never a fail into a pass) and says that the number is an estimate.

- **Capability:** honest held-object height in verify/done. Failure type: false completion (done accepted, simulator says fail). In the failure census, 41 of 115 false-done episodes were of this kind.
- **Proposed by:** master agent, from a failure cluster.
- **Evidence (ledger):** direction screen on target tasks: 9 wins / 1 loss. Accepted as part of H* under the pre-registered rule: on 1,180 planned dev pairs, the decision set (194 pairs) gained +18.04 pp, one-sided lower bound +12.24 pp; target cluster 45 wins / 18 losses; the new check fired in 69 candidate episodes and 0 parent episodes. On the 500 evaluation episodes: 63.6% vs 60.4% for H16.
- **This pair:** `handover_mic`, seed 69209. The first five calls are almost the same in both runs. On H16, verify says "bottom 21.8 cm above the table (from the gripper pose)" and done is accepted, but the task fails. On H*, verify rejects the height ("estimated lowest point only about 17.9 cm … not confirmed to be 20 cm up"). The model lifts 4 cm, verify passes at about 22.0 cm, and the task succeeds.

**Check result, before vs after (`["height", "microphone", 20]`):**

```diff
-{"ok": true,  "why": "held by ['left']; bottom 21.8 cm above the table (from the gripper pose)"}
+{"ok": false, "why": "held by ['left']; the gripper-pose estimate says bottom ..., but the estimated lowest point of the held
+  microphone is only about 17.9 cm (estimate, not measured now: ... gripped off its centre, so it may also have swung round
+  the fingers ...); not confirmed to be 20 cm up", "height_est_cm": 17.9}
+→ move(arm="left", dz=4) → verify: {"ok": true, "why": "... estimated lowest point about 22.0 cm (estimate, not measured)"}
```

**Harness code:**

```diff
 def _pred(self, p, args, now):
     ok, why = _EXQ4Parent._pred(self, p, args, now)
+    if p not in ("lifted", "height") or ok is not True:
+        return ok, why                       # only a parent pass can be revised
+    rigid, swing, lever = self._exq4_low_cm(held_by[0])   # grasp-time cloud moved with the gripper (+ swing if off-centre)
+    low = min(rigid, swing) if swing is not None else rigid
+    if low < need:
+        return False, f"... estimated lowest point of the held {args[0]} is only about {low:.1f} cm ...; not confirmed to be {need:g} cm up"
```

