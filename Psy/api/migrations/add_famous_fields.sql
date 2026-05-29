-- 给 famous_people 表增加新字段
ALTER TABLE famous_people
  ADD COLUMN theory TEXT COMMENT '理论思想' AFTER works,
  ADD COLUMN influence TEXT COMMENT '人物影响' AFTER theory,
  ADD COLUMN evaluation TEXT COMMENT '人物评价' AFTER influence,
  ADD COLUMN published_books TEXT COMMENT '出版图书' AFTER evaluation,
  ADD COLUMN gallery TEXT COMMENT '图片集(JSON数组,1-8张)' AFTER published_books;
