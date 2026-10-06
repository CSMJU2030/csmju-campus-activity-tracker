# csmju-campus-activity-tracker

Campus Activity Tracker — ระบบย่อยของโครงการ CSMJU2030

มาตรฐานกลางอยู่ใน `standards/` (submodule ของ CSMJU2030/csmju2030-standards)
pin ไว้ที่ standards v1.8.1 (`.standards-version`)

## เริ่มทำงาน

```bash
git submodule update --init standards/
pnpm install
git checkout -b feature/campus-activity-tracker/<เรื่องที่ทำ>
```

ก่อนเปิด PR อ่าน `standards/docs/github-workflow.md` ข้อ 1

## การใช้งาน

เข้าสู่ระบบผ่าน CSMJU Core Hub:

- ทุก role ดูรายการกิจกรรมที่เผยแพร่แล้วได้ที่หน้าแรก
- STAFF และ ADMIN จะเห็นเมนู **โพสต์กิจกรรม** สำหรับเผยแพร่กิจกรรมพร้อมวันเวลาไทย (Asia/Bangkok) สถานที่ รายละเอียด และลิงก์สมัครภายนอก
- กิจกรรมที่บันทึกจากหน้าจัดการจะเผยแพร่ให้นักศึกษาเห็นทันที; นักศึกษาสมัครกับผู้จัดผ่านลิงก์ภายนอก

## ทดสอบ Docker ในเครื่อง

เปิด Core Hub ในเครื่องก่อน โดยให้ API อยู่ที่ `http://localhost:3000` และเว็บอยู่ที่
`http://localhost:3100` พร้อมลงทะเบียน subsystem callback เป็น
`http://localhost:3202/auth/callback`

```bash
docker compose up -d --build
docker compose ps
docker compose logs api
```

บริการ `db`, `api` และ `web` ต้องเป็น `healthy` ก่อนเปิด `http://localhost:3202`
ใน Chrome แล้วทดสอบ login ผ่าน Core Hub เว็บเปิดที่ host port `3202`; API ใช้
port `4000` เฉพาะใน network ของ Compose และฐานข้อมูลทดสอบเปิดที่ `localhost:5435`.
ใช้ `docker compose down` เพื่อหยุดบริการ โดยข้อมูลฐานข้อมูลยังอยู่ใน volume.

Compose นี้ตั้ง API เป็น `development` เพราะ Core Hub ในเครื่องให้ JWKS ผ่าน HTTP;
ค่าที่ deploy จริงต้องใช้ `NODE_ENV=production` และค่าลับที่ DevOps จัดให้ ห้ามนำ
รหัสผ่านตัวอย่างใน Compose ไปใช้บน server. รายละเอียดเต็มอยู่ใน
`standards/docs/deployment.md`.
