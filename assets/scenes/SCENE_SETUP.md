# Cocos Scene Setup

โปรเจกต์นี้เตรียม assets และ scripts สำหรับ 4 scene ไว้แล้ว:

- `TitleScene`
- `HomeScene`
- `VillageScene`
- `ForestScene`

วิธีประกอบ scene อย่างเร็วใน Cocos Creator 3.8:

1. เปิดโปรเจกต์ใน Cocos Creator แล้วสร้าง scene ใหม่ 4 ไฟล์ในโฟลเดอร์นี้ด้วยชื่อด้านบน
2. ในแต่ละ scene ให้สร้าง node ว่างชื่อ `SceneBootstrap`
3. เพิ่ม component `SceneBootstrap` จาก `assets/scripts/controllers/SceneBootstrap.ts`
4. ตั้งค่า `sceneKind` ให้ตรงกับชื่อ scene
5. ลาก SpriteFrame จาก texture ต่อไปนี้ลง Inspector:
   - `bgTitle`: `assets/textures/backgrounds/bg_title.png`
   - `bgHome`: `assets/textures/backgrounds/bg_home.png`
   - `bgVillage`: `assets/textures/backgrounds/bg_village.png`
   - `bgForest`: `assets/textures/backgrounds/bg_forest.png`
   - `playerIdle`: `assets/textures/characters/player_idle.png`
   - `playerWalkFrames`: `assets/textures/characters/player_walk_0.png` ถึง `player_walk_3.png` เรียงตามเลข
   - `npcChief`: `assets/textures/characters/npc_chief.png`
   - `monsterSlime`: `assets/textures/monsters/monster_slime.png`
   - `dialogueBox`: `assets/textures/ui/ui_dialogue_box.png`
6. เปิด Physics 2D ใน Project Settings หากยังไม่ได้เปิด
7. เพิ่มทั้ง 4 scene เข้า Build Scenes โดยให้ `TitleScene` อยู่ลำดับแรก
8. เวลาเริ่มเล่น ให้เปิด `TitleScene` แล้วกด Preview/Play จากนั้นกดปุ่ม `เริ่มเกม`

Flow ตอนเล่น:

`TitleScene` -> กด `เริ่มเกม` -> `HomeScene` -> เดินชนประตู -> `VillageScene` -> เดินไปซ้ายสุด -> `ForestScene`

โครงสร้าง `HomeScene` รุ่นปัจจุบัน:

- สร้างพื้นจาก tile raster หลายชิ้น ไม่ได้แสดง `bg_home.png` เป็นภาพฉากแบน
- แยก layer เป็นพื้น, สถาปัตยกรรม, world objects แบบ Y-sort และ foreground
- ตัวละครเดินได้ 4 ทิศในบ้าน และมี collider ขนาดเล็กบริเวณเท้า
- เตียง โต๊ะ ชั้นวาง ครัว เตาผิง และขอบห้องมี collider แยก
- เฟอร์นิเจอร์กับตัวละครเรียงหน้า-หลังตามตำแหน่งแกน Y
- asset บ้านแบบวาดจริงอยู่ที่ `assets/resources/home` และโหลดด้วย Resources API

หมายเหตุ: ไฟล์ `.scene` ควรสร้างผ่าน Cocos Editor เพื่อให้ UUID/meta และ serialized component ถูกต้องตามเครื่องนี้
ไม่ควรเขียน JSON scene ด้วยมือถ้าไม่มี Editor CLI เพราะเสี่ยงเปิด scene ไม่ได้
