# H7 → H12: say which side faces where now, and the tool turns it around

**Change.** `place` / `carry` gained a `face_now` argument: the planner names the direction the object's flat face points to *now* (as seen in the images) and the tool turns that side to the requested `face`, with sign and over the full half turn. Before, the planner had to guess a relative `turn_deg`; a flat sign has two flat sides, so the tool could not tell which one was meant. In the same step the task note for this task was audited against the expert end states and rewritten: the old note had copied a numeric "xy = [20, −15], turn_deg = −90" from the demos; the new one says the stand starts with the QR side facing away, so place with `face="front", face_now="back"`.

- **Capability:** `face_now` for place/carry (orientation) + audited end-state note for rotate_qrcode. The ledger notes that the tool, the face-plane slicing and the note were not separated.
- **Proposed by:** `face_now`: an external LLM review, implemented by the master agent; note rewrite: master agent after a failure-cluster audit.
- **Evidence (ledger):** H7 solved rotate_qrcode in 0 of 30 dev episodes (0/41 in all earlier records). After the change, all 6 rotate_qrcode successes over two dev passes were a single `place(face="front", face_now="back")` that turned the stand 170–178°. On the 50 × 10 evaluation episodes, rotate_qrcode went from 0/10 to 5/10. Overall, H12 scored 51.1% vs 49.7% for H7 on those 500 episodes (p = 0.52).
- **This pair:** `rotate_qrcode`, seed 68506. H7 places with `turn_deg=-90` and the QR side does not face the robot. H12 turns it 178° and succeeds in 5 calls.

**Tool result, before vs after:**

```diff
-place(arm="right", object="paymentsign", ref="table", xy=[20,-15], turn_deg=-90)
-→ {"code": "OK", "turned_deg": -90, "placed_offset_cm": [-1.7, -0.5]}        # task fails: QR side not toward the robot
+place(arm="left", object="paymentsign", ref="table", xy=[-9,-12], face="front", face_now="back")
+→ {"code": "OK", "turned_deg": 178, "placed_offset_cm": [1.3, 1.8]}          # task succeeds
```

**Harness code (`_face_turn`):**

```diff
     y = (want - cur + 90) % 180 - 90            # thin axis only: the sign of the face is ambiguous
+    dn = {"front": [0, -1.0], "back": [0, 1.0], "left": [-1.0, 0], "right": [1.0, 0]}.get(str(face_now or "").lower())
+    if dn is not None:   # the side that points toward face_now now is the one to turn (signed, full range)
+        n = np.asarray(m[:2], float) * (1.0 if float(np.dot(m[:2], dn)) >= 0 else -1.0)
+        cur = np.degrees(np.arctan2(n[1], n[0]))
+        y = (want - cur + 180) % 360 - 180
```

