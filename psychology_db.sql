-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: psychology_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','2026-03-17 23:39:04','2026-03-17 23:39:04');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_summaries`
--

DROP TABLE IF EXISTS `book_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_summaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `summary_content` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_book_id` (`book_id`),
  CONSTRAINT `book_summaries_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_summaries`
--

LOCK TABLES `book_summaries` WRITE;
/*!40000 ALTER TABLE `book_summaries` DISABLE KEYS */;
INSERT INTO `book_summaries` VALUES (1,1,'{\"intro\": \"《思考，快与慢》是诺贝尔经济学奖得主丹尼尔·卡尼曼的代表作，系统性地介绍了影响人类判断与决策的认知偏误。本书分为五个部分，深入探讨了大脑的两个系统——快速、直觉、情绪化的系统1，以及缓慢、理性、逻辑化的系统2之间的互动关系。\\n\\n卡尼曼通过丰富的实验案例和研究成果，揭示了人类思维中存在的系统性偏差。他指出，尽管系统1为我们提供了快速、自动的判断，但它也容易导致各种思维错误；而系统2虽然更加理性，却常常懒惰且容易疲劳。\\n\\n本书不仅是一部学术著作，更是一本实用的人生指南，帮助读者理解自己在生活、工作、投资等各个领域可能犯下的决策错误。\", \"highlights\": [\"深入理解大脑的两种思维模式\", \"识别和避免常见认知偏误\", \"提升判断质量和决策能力\", \"诺贝尔奖得主的毕生研究精华\"]}','2026-03-17 23:39:04','2026-04-02 19:49:09'),(2,2,'{\"intro\": \"经典说服心理学，拆解互惠、承诺一致、社会认同、喜好、权威、稀缺等影响机制。\"}','2026-03-19 20:23:45','2026-03-19 23:58:57'),(3,3,'{\"intro\": \"讨论群体心理的形成、暗示与情绪传染，以及个体在群体中的行为变化。\"}','2026-03-19 20:23:45','2026-03-20 00:14:08');
/*!40000 ALTER TABLE `book_summaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `author` varchar(100) NOT NULL,
  `isbn` varchar(20) NOT NULL,
  `publisher` varchar(100) NOT NULL,
  `publish_date` date NOT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `ebook_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_title` (`title`),
  KEY `idx_author` (`author`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'思考，快与慢','丹尼尔·卡尼曼','9787508633558','中信出版社','2012-06-30','/uploads/思考快与慢.jpg','https://book.douban.com/subject/33444912/','2026-03-17 23:39:04','2026-04-02 20:03:23'),(2,'影响力','罗伯特西奥迪尼','9787508661056','北京联合出版公司','2015-12-31','/uploads/影响力.jpg','https://book.douban.com/subject/1786387/','2026-03-19 20:23:45','2026-04-02 20:03:23'),(3,'乌合之众','古斯塔夫勒庞','9787511310015','中国华侨出版社','2011-05-31','/uploads/乌合之众.jpg','https://book.douban.com/subject/1002422/','2026-03-19 20:23:45','2026-04-02 20:03:23');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_effects`
--

DROP TABLE IF EXISTS `daily_effects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_effects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `effect_id` int NOT NULL,
  `display_date` date NOT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_display_date` (`display_date`),
  KEY `idx_effect_id` (`effect_id`),
  KEY `idx_display_date` (`display_date`),
  CONSTRAINT `daily_effects_ibfk_1` FOREIGN KEY (`effect_id`) REFERENCES `psychological_effects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_effects`
--

LOCK TABLES `daily_effects` WRITE;
/*!40000 ALTER TABLE `daily_effects` DISABLE KEYS */;
INSERT INTO `daily_effects` VALUES (1,1,'2026-03-17',1,'2026-03-17 23:39:04','2026-03-17 23:39:04');
/*!40000 ALTER TABLE `daily_effects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `effect_media`
--

DROP TABLE IF EXISTS `effect_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `effect_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `effect_id` int NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_effect_id` (`effect_id`),
  CONSTRAINT `effect_media_ibfk_1` FOREIGN KEY (`effect_id`) REFERENCES `psychological_effects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `effect_media`
--

LOCK TABLES `effect_media` WRITE;
/*!40000 ALTER TABLE `effect_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `effect_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `psychological_effects`
--

DROP TABLE IF EXISTS `psychological_effects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `psychological_effects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `proposer` varchar(100) NOT NULL,
  `description` text,
  `experiment_detail` json DEFAULT NULL,
  `explanation` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_proposer` (`proposer`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `psychological_effects`
--

LOCK TABLES `psychological_effects` WRITE;
/*!40000 ALTER TABLE `psychological_effects` DISABLE KEYS */;
INSERT INTO `psychological_effects` VALUES (1,'吊桥效应','阿瑟·阿伦 (Arthur Aron)','当一个人提心吊胆地过吊桥的时候，会不由自主地心跳加快。如果这个时候，碰巧遇见一个异性，那么他会错把由这种情境引起的心跳加快理解为对方使自己心动，才产生的生理反应，故而对对方滋生出爱情的情愫。','{\"title\": \"卡皮拉诺吊桥实验\", \"content\": \"1974年，心理学家阿瑟·阿伦在温哥华的卡皮拉诺吊桥上进行了一项经典的心理学实验。这座悬索桥长达137米，桥面仅有1.5米宽，步行通过时会让人感到明显的摇晃和恐惧感。实验由一位年轻漂亮的女助手担任主试，她分别在吊桥和一座坚固的低矮木桥上对男性过路者进行问卷调查。调查结束后，女助手会留下自己的电话号码，告知参与者如果对研究有兴趣可以打电话交流。\\n\\n结果令人惊讶：经过吊桥的男性给女助手打电话的比例（50%）远高于经过木桥的男性（12.5%）。更重要的是，吊桥组的男性对女助手的吸引力评分也显著更高，他们描述的图片也更容易带有浪漫或性意味。这个实验有力地证明了生理唤醒与认知解释之间的交互作用。\"}','吊桥效应揭示了心理学中一个重要的现象：生理唤醒的错误归因（Misattribution of Arousal）。\n\n当个体处于高唤醒状态（如过吊桥时的恐惧、心跳加速）时，如果身边有异性出现，他会倾向于将这种生理唤醒归因于对方对自己的吸引力，而非环境因素。这种现象在多个领域都有重要应用：\n\n1. 约会场景：运动后的心跳加速可能被误认为是对约会对象的心动，因此许多约会活动会安排在运动之后进行。\n\n2. 紧急情况：在紧急情况下的相互帮助更容易产生亲密感，这就是为什么共同经历危险的人往往关系更紧密。\n\n3. 市场营销：恐怖电影、惊险游乐设施旁边的浪漫邂逅场景设计，正是利用了这一效应。\n\n理解吊桥效应有助于我们更理性地认识自己的情感反应，避免被错误的生理信号误导。同时，它也提醒我们在做重要决策时，要注意区分真实的情感反应和环境诱发的生理变化。','2026-03-17 23:39:04','2026-04-02 19:49:09'),(2,'锚定效应','阿莫斯特沃斯基 & 丹尼尔卡尼曼','人们在做判断时会过度依赖最先获得的信息（锚点），后续调整往往不足。','{\"title\": \"轮盘数字与估计\", \"content\": \"研究让被试先看到一个随机数字，再估计某个问题的答案。即便数字与问题无关，也会显著影响估计值。\"}','锚点会成为参考框架，后续信息加工围绕锚点进行微调而非重新计算，导致系统性偏差。','2026-03-19 20:23:45','2026-03-19 20:23:45'),(3,'从众效应','所罗门阿希 (Solomon Asch)','即便群体明显错误，个体也可能为了融入而跟随多数意见。','{\"title\": \"阿希线段实验\", \"content\": \"1951年，心理学家所罗门·阿希设计了一个经典的从众实验。他让参与者判断三条线段中哪一条与标准线段等长。单独测试时，正确率超过99%。但在群体情境中，当其他几名假参与者（实际上是实验助手）一致给出错误答案时，真正参与者的正确率下降到了25%。实验设置了多个条件：只有一人给出错误答案时，从众率为1%；两人给出错误答案时，从众率上升到12.5%；当四人给出错误答案时，从众率飙升至33%。这个实验揭示了社会压力对个人判断的强大影响。\"}','从众效应（Conformity）是指个体在群体的影响下，改变自己的行为或信念，以符合群体规范或行为的心理现象。这种现象在日常生活中极为常见，从购物选择到政治态度，都可能受到群体的影响。\n\n从众效应的产生机制包括：\n\n1. 规范性影响：我们希望被群体接受和喜欢，因此倾向于与群体保持一致。\n\n2. 信息性影响：当面对不确定情境时，我们假设他人拥有更多知识，从而参考他人的行为。\n\n3. 社会认同：我们渴望与他人建立联系，认同某个群体会让我们采用该群体的信念和行为。\n\n从众效应的应用场景：\n\n- 营销策略：好评、销量数据展示利用了信息性影响。\n- 社会运动：倡导者需要一定数量的早期支持者来吸引更多人加入。\n- 组织管理：领导者应注意避免群体思维，鼓励独立思考。\n\n理解从众效应有助于我们保持独立思考，同时也能更有效地设计沟通策略。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(4,'旁观者效应','约翰达利 & 比布拉塔内 (Darley & Latané)','在紧急情境中，旁观者越多，个体越不容易出手帮助。','{\"title\": \"达利和拉塔内的旁观者实验\", \"content\": \"1968年，比布·拉塔内和约翰·达利进行了著名的旁观者效应实验。参与者单独或在群体中通过内部通话系统交流。当他们听到假设的癫痫发作（实际上是录音）时：单独情况下，85%的参与者会报告紧急情况；而在群体中，只有31%的参与者迅速采取行动。这清楚地表明，个体在群体中更倾向于认为情况不紧急或相信他人会干预，从而推迟或避免采取行动。\"}','旁观者效应（Bystander Effect）是指在紧急情况下，个体在有其他人在场时，提供帮助的可能性会降低的现象。这一发现对于理解社会责任和紧急情况下的行为具有重要意义。\n\n旁观者效应的产生原因：\n\n1. 责任分散：当有他人存在时，个人会觉得紧急救助的责任由众人分担，从而减轻自己的责任感。\n\n2. 社会比较：人们会观察他人的反应来判断情况的紧急程度。如果他人都显得平静，可能认为情况不紧急。\n\n3. 群体冷漠：在某些文化背景下，对陌生人保持冷漠被视为一种社会规范。\n\n如何克服旁观者效应：\n\n- 明确求助：当你需要帮助时，指定具体的人而不是泛泛地呼救。\n- 承担责任：意识到自己的帮助可能至关重要。\n- 紧急情况下的训练：了解旁观者效应，在紧急情况发生时保持警觉。\n\n这一研究对公共安全政策、紧急救援培训都有重要启示。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(5,'光环效应','爱德华桑代克 (Edward Thorndike)','对某人的单一突出特质（如外貌、能力）会影响我们对其整体评价。','{\"title\": \"凯利印象形成实验\", \"content\": \"1950年，心理学家哈罗德·凯利设计了一个实验来研究光环效应。参与者被告知有两位客座讲师将访问他们的班级。一位被介绍为\'warm\'（温暖），另一位被介绍为\'cold\'（冷淡）。实际上，两位讲师使用了完全相同的材料讲课。但学生们对两位讲师的评价呈现出显著差异：\'warm\'讲师被认为更友善、更受欢迎；而\'cold\'讲师被认为更有学问但不太友好。这表明一个特征（温暖或冷淡）会扩散到对一个人的整体印象。\"}','光环效应（Halo Effect）是指我们对某个人的某种特征形成印象后，这种印象会影响我们对这个人其他特征的判断的心理倾向。这一效应在日常生活中非常普遍，也经常被应用到商业和政治领域。\n\n光环效应的主要表现：\n\n1. 外表吸引力：外表有魅力的人往往被认为更聪明、更成功。\n\n2. 名人代言：消费者可能因为喜欢某位名人而认为他/她推荐的产品更好。\n\n3. 首因效应：第一印象会影响后续对同一人的所有评价。\n\n4. 品牌效应：知名品牌的产品即使质量相同也可能被认为更好。\n\n克服光环效应的方法：\n\n- 意识到偏见的存在，有意识地抵制以偏概全的判断。\n- 分别评估各个特征，避免让一个特征污染其他判断。\n- 寻求客观数据和多方意见。\n\n理解光环效应对于提高判断质量、避免决策失误具有重要意义。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(6,'确认偏误','彼得沃森 (Peter Wason)','人们更容易寻找、解释并记住支持自己观点的信息，而忽视反例。','{\"title\": \"沃森选择任务实验\", \"content\": \"1966年，皮特·沃森设计了一个推理任务来研究确认偏误。参与者看到一张背面有红桃A、K、Q的数字组合，然后需要猜测规则是什么。规则是\'两张偶数\'，但参与者通常会先提出\'有一张红桃\'这样的假设，然后只测试符合假设的情况，而非尝试证伪它。实验显示，大多数人需要平均8-9次测试才能发现正确规则，而实际上只需要更少的测试就能通过证伪快速排除错误假设。\"}','确认偏误（Confirmation Bias）是指人们倾向于寻找、解释和记住那些证实自己已有信念的信息，而忽略或贬低与之相矛盾的证据。这种心理倾向严重影响了我们的决策质量和客观判断能力。\n\n确认偏误的表现形式：\n\n1. 选择性注意：我们更容易注意到支持自己观点的信息。\n\n2. 证实性搜索：主动寻找支持自己假设的证据。\n\n3. 动机性推理：情感和动机影响我们对信息的解读。\n\n4. 后见之明偏误：事后认为某事件\'早就知道会这样\'。\n\n如何减少确认偏误：\n\n- 主动寻找反对意见，挑战自己的假设。\n- 在做出重要决策前，列出支持和反对的理由。\n- 与不同观点的人讨论，听取不同意见。\n- 记录自己的预测，然后回顾检验。\n\n在信息爆炸的时代，确认偏误可能导致严重的误解和错误决策，值得我们警惕。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(7,'达克效应','大卫达宁 & 贾斯汀克鲁格 (Dunning & Kruger)','能力较弱的人往往高估自己，而能力较强的人反而低估自己。','{\"title\": \"邓宁-克鲁格效应研究\", \"content\": \"1999年，贾斯汀·克鲁格和大卫·邓宁进行了一系列研究来验证达克效应。在实验中，他们让参与者完成语法、逻辑和幽默感测试，然后请他们评估自己的表现。结果显示，表现最差的人往往高估自己的能力（位于前37%），而表现最好的人则倾向于低估自己（谦虚效应）。例如，在幽默感测试中得分最低的四分之一参与者，高估自己的得分约46%；而在语法测试中得分最低四分之一的人高估约42%。\"}','达克效应（Dunning-Kruger Effect）是一种认知偏误，指能力较低的人倾向于高估自己的能力，而能力较高的人则倾向于低估自己的能力。这一效应提醒我们自知之明的重要性。\n\n达克效应的原因：\n\n1. 元认知能力缺陷：要正确评估自己的技能，需要对这一技能有足够的了解。\n\n2. 虚假自信：能力不足的人缺乏识别正确与错误之间的区别。\n\n3. 双重困境：最需要提高技能的人最不可能意识到自己的不足。\n\n如何应对达克效应：\n\n- 保持谦逊，认识到知识的海洋浩瀚无边。\n- 积极寻求反馈，特别是来自专家和批评者的反馈。\n- 持续学习和反思，不要停止在某个水平。\n- 学会说\'我不知道\'，这是智慧而非弱点。\n\n达克效应提醒我们，真正的专家会意识到自己还有多少不知道的，这本身就是一种成熟的认知。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(8,'自证预言','罗伯特默顿 (Robert K. Merton)','对某事的预期会影响行为，从而推动预期成真。','{\"title\": \"罗森塔尔效应实验\", \"content\": \"1968年，罗伯特·罗森塔尔和雅各布森在加州一所小学进行了一项经典实验。他们随机选择了一些学生，告诉老师这些学生是\'学习潜力急剧增长者\'。实际上，这些学生是随机选择的，没有任何特殊之处。8个月后的测试显示，这些\'被期望\'的学生确实表现出更高的智商分数增长，而老师对这些学生的评价也更加正面。这一效应后来被称为\'皮格马利翁效应\'或\'罗森塔尔效应\'。\"}','自证预言（Self-fulfilling Prophecy）是指人们对他人的期望会影响该人的行为，使其最终实现这些期望的心理现象。这一效应在教育、管理和人际关系中都有重要应用。\n\n自证预言的形成机制：\n\n1. 期望传递：教师/管理者对高期望学生的非语言沟通更积极。\n\n2. 行为差异：教师可能无意中给高期望学生更多关注和机会。\n\n3. 自我认同：学生感受到期望后，可能内化这些期望并调整行为。\n\n4. 环境塑造：高期望可能创造更有挑战性和支持性的学习环境。\n\n自证预言的应用：\n\n- 教育领域：教师的正向期望可以显著提高学生表现。\n- 职场管理：管理者对员工的积极期望可能提高其绩效。\n- 人际关系：积极期望有助于建立更好的关系。\n\n重要的是要意识到自证预言的存在，用它来创造积极影响，同时避免负面期望的破坏性影响。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(9,'禀赋效应','理查德塞勒 (Richard Thaler)','人们一旦拥有某物，会更高估其价值，卖出要价往往高于买入愿意支付的价格。','{\"title\": \"塞勒的马克杯实验\", \"content\": \"1990年，理查德·塞勒设计了一个马克杯实验来研究禀赋效应。他将参与者分为两组：马克杯卖方和马克杯买方。卖方被给予一个马克杯（建立所有权），然后询问他们愿意接受的最低价格；买方则没有被给予马克杯，询问他们愿意支付的最高价格。结果显示，卖方的平均保留价格是买方平均出价的2倍多（7.12美元 vs 2.87美元）。这种差异被称为\'损失厌恶\'在所有权中的体现。\"}','禀赋效应（Endowment Effect）是指当人们拥有某件物品时，会对这件物品的估价高于他们没有这件物品时愿意为其支付的价格。这种效应与我们对损失的厌恶密切相关。\n\n禀赋效应的原因：\n\n1. 损失厌恶：失去某物的痛苦大于获得等量收益的快乐。\n\n2. 心理所有权：一旦拥有某物，心理上会产生一种所有权感。\n\n3. 焦点效应：卖方关注的是放弃的痛苦，买方关注的是获得的价值。\n\n禀赋效应的应用：\n\n- 市场营销：免费试用利用了禀赋效应，试用后人们不愿归还。\n- 房地产交易：卖家往往高估自己房产的价值。\n- 谈判策略：先出价的一方往往处于不利地位。\n\n如何克服禀赋效应：\n\n- 从\'冷眼旁观\'的角度思考，假设自己没有拥有该物品。\n- 关注市场价值，而非个人情感价值。\n- 设置客观标准，参考同类物品的市场价格。\n\n理解禀赋效应有助于我们做出更理性的经济决策。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(10,'沉没成本效应','阿莫斯特沃斯基 & 丹尼尔卡尼曼','已投入的时间/金钱会让我们更难止损，即便继续投入不再划算。','{\"title\": \"沉没成本谬误实验\", \"content\": \"在经典实验中，参与者被告知已经购买了一张电影票（20美元），但在电影开始前发现还有一张更精彩的演唱会（30美元）的机会，而他们只有足够的钱买其中之一。同时，另一个参与者只有20美元面临同样的选择。结果显示，第一组中大多数人选择去看已购买的平庸电影（因为不想浪费电影票），而第二组中大多数人选择去看演唱会。这说明人们对已支付的\'沉没成本\'过度敏感，导致非理性决策。\"}','沉没成本效应（Sunk Cost Effect）是指人们在决策时倾向于考虑已经投入且无法收回的成本（沉没成本），而这些成本在理性决策中应该是无关紧要的。这种倾向导致人们坚持错误的选择，造成更大的损失。\n\n沉没成本效应的影响因素：\n\n1. 损失厌恶：承认沉没成本等于承认损失。\n\n2. 承诺升级：为之前的决策辩护，避免承认错误。\n\n3. 自我认同：放弃意味着之前的判断是错误的。\n\n4. 互惠规范：投入了努力，希望得到回报。\n\n沉没成本谬误的表现：\n\n- 继续看完一部无聊的电影。\n- 在亏损的投资上加仓。\n- 继续一个注定失败的项目。\n- 保留无用的物品（因为我买了）。\n\n如何避免沉没成本谬误：\n\n- 每次决策时只考虑未来的成本和收益。\n- 设定明确的退出标准。\n- 将决策与身份认同分离。\n- 记住：\'过去的事就让它过去\'。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(11,'破窗效应','詹姆斯威尔逊 & 乔治凯林 (Wilson & Kelling)','微小的失序信号（如涂鸦、垃圾）会降低规范约束，诱发更严重的违规行为。','{\"title\": \"破窗理论验证实验\", \"content\": \"为了验证破窗效应，心理学家在一辆无人看管的汽车上进行了实验。当汽车完好无损时，很少有人对它进行破坏或偷窃。但当研究人员故意打碎一扇车窗后，汽车在几个小时内就被完全拆解和偷走。这个实验直观地展示了小问题如何引发更大的问题，以及环境中的\'失序信号\'如何影响人们的行为。城市犯罪研究也发现，乱涂乱画未及时清理的街区，后续的破坏和犯罪率会显著上升。\"}','破窗效应（Broken Windows Theory）源自犯罪学理论，后来被广泛应用于社会心理学和组织行为学。该理论认为，环境中的细小失序（如破窗、涂鸦、垃圾）会传递\'无人关心\'的信号，进而导致更严重的失序和犯罪。\n\n破窗效应的心理机制：\n\n1. 规范性信息：环境中的线索传递出\'什么行为是可接受的\'信号。\n\n2. 社会学习：观察他人的违规行为会降低自我约束。\n\n3. 逐步升级：小违规可能导致更大的问题。\n\n4. 去个性化：混乱环境中人们更可能做出平时不会做的事。\n\n破窗效应的应用：\n\n- 城市治理：及时修复小问题可以预防大问题。\n- 社区建设：维护公共空间整洁有助于减少破坏行为。\n- 个人习惯：小习惯的养成或打破会影响更大的行为模式。\n\n启示：\n\n- 注意环境中的\'第一扇破窗\'。\n- 及时处理小问题，防止累积成大问题。\n- 创造积极的\'规范信号\'环境。','2026-03-19 20:23:45','2026-04-02 19:53:46'),(12,'损失厌恶','丹尼尔·卡尼曼 & 阿莫斯·特沃斯基','损失厌恶是指人们面对同样数量的损失和收益时，损失带来的痛苦感远大于等量收益带来的愉悦感。','{\"title\": \"最后通牒博弈实验\", \"content\": \"在最后通牒博弈实验中，两个参与者被分配10美元。提议者提出分钱方案，响应者可以接受或拒绝。如果拒绝，两人都什么都得不到。经济学理性人假设预测响应者会接受任何正数，因为有总比没有好。\\n\\n但实际结果却大相径庭：大多数响应者会拒绝低于2-3美元的提议，他们宁愿什么都得不到也不愿接受被视为不公平的分配。这显示了人们对损失的强烈厌恶。\"}','损失厌恶深深根植于人类的进化历程中。在远古时代，对威胁的敏感比对机会的敏感更能提高生存概率。\n\n损失厌恶的应用领域：\n\n1. 投资理财：投资者往往过早卖出盈利股票，却长期持有亏损股票。\n\n2. 营销策略：强调「不要错过」比强调「获得」更有效。\n\n3. 健康行为：人们对疾病威胁的反应比对健康收益更强烈。\n\n4. 谈判技巧：框架效应——将条款表述为「损失」而非「未获得」往往更有效。\n\n理解损失厌恶有助于我们识别自身的决策偏见，在面对损失时保持冷静。','2026-04-02 19:49:09','2026-04-02 19:49:09');
/*!40000 ALTER TABLE `psychological_effects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_episodes`
--

DROP TABLE IF EXISTS `video_episodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_episodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL COMMENT '鎵?睘绯诲垪ID',
  `episode_number` int NOT NULL COMMENT '闆嗘暟',
  `title` varchar(200) NOT NULL COMMENT '闆嗘爣棰',
  `video_url` varchar(500) DEFAULT NULL COMMENT '瑙嗛?閾炬帴锛圔绔欏祵鍏ラ摼鎺ワ級',
  `bv_number` varchar(20) DEFAULT NULL COMMENT 'B绔橞V鍙',
  `duration` varchar(20) DEFAULT NULL COMMENT '鏃堕暱',
  `description` text COMMENT '鍗曢泦绠?粙',
  `intro` json DEFAULT NULL COMMENT 'AI鐢熸垚鐨勫崟闆嗕粙缁',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缂╃暐鍥',
  `status` tinyint(1) DEFAULT '1' COMMENT '鐘舵?锛?闅愯棌1鏄剧ず',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `video_episodes_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `video_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_episodes`
--

LOCK TABLES `video_episodes` WRITE;
/*!40000 ALTER TABLE `video_episodes` DISABLE KEYS */;
INSERT INTO `video_episodes` VALUES (1,1,1,'精神分析初级教程','https://www.bilibili.com/video/BV1AC7nzxEC6/','BV1AC7nzxEC6',NULL,'精神分析初级教程全集',NULL,NULL,1,'2026-04-04 20:45:41','2026-04-04 20:45:41');
/*!40000 ALTER TABLE `video_episodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_series`
--

DROP TABLE IF EXISTS `video_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '绯诲垪鏍囬?',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '灏侀潰鍥',
  `author` varchar(100) DEFAULT NULL COMMENT '浣滆?/UP涓',
  `source` enum('bilibili','youtube','other') DEFAULT 'bilibili' COMMENT '瑙嗛?鏉ユ簮',
  `source_url` varchar(500) DEFAULT NULL COMMENT '鏉ユ簮閾炬帴',
  `category` varchar(50) DEFAULT 'psychology' COMMENT '鍒嗙被锛歱sychology鍝插?',
  `description` text COMMENT '绯诲垪绠?粙',
  `intro` json DEFAULT NULL COMMENT 'AI鐢熸垚鐨勭郴鍒椾粙缁嶏紙绾?00瀛楋級',
  `display_order` int DEFAULT '0' COMMENT '鏄剧ず椤哄簭',
  `status` tinyint(1) DEFAULT '1' COMMENT '鐘舵?锛?闅愯棌1鏄剧ず',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_series`
--

LOCK TABLES `video_series` WRITE;
/*!40000 ALTER TABLE `video_series` DISABLE KEYS */;
INSERT INTO `video_series` VALUES (1,'精神分析系列',NULL,'羲北偏北','bilibili',NULL,'psychology','精神分析初级教程系列','{\"content\": \"系统讲解精神分析基础知识\"}',0,1,'2026-04-04 20:45:41','2026-04-04 20:45:41');
/*!40000 ALTER TABLE `video_series` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10 23:21:10
