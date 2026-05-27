import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123.com.cn',
  database: process.env.DB_NAME || 'psychology_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function updateContent() {
  const connection = await pool.getConnection();
  
  try {
    console.log('开始更新数据...\n');

    // 更新吊桥效应 - 使用参数化查询
    const craneExperiment = JSON.stringify({
      title: "卡皮拉诺吊桥实验",
      content: "1974年，心理学家阿瑟·阿伦在温哥华的卡皮拉诺吊桥上进行了一项经典的心理学实验。这座悬索桥长达137米，桥面仅有1.5米宽，步行通过时会让人感到明显的摇晃和恐惧感。实验由一位年轻漂亮的女助手担任主试，她分别在吊桥和一座坚固的低矮木桥上对男性过路者进行问卷调查。调查结束后，女助手会留下自己的电话号码，告知参与者如果对研究有兴趣可以打电话交流。\n\n结果令人惊讶：经过吊桥的男性给女助手打电话的比例（50%）远高于经过木桥的男性（12.5%）。更重要的是，吊桥组的男性对女助手的吸引力评分也显著更高，他们描述的图片也更容易带有浪漫或性意味。这个实验有力地证明了生理唤醒与认知解释之间的交互作用。"
    });
    
    const craneExplanation = `吊桥效应揭示了心理学中一个重要的现象：生理唤醒的错误归因（Misattribution of Arousal）。

当个体处于高唤醒状态（如过吊桥时的恐惧、心跳加速）时，如果身边有异性出现，他会倾向于将这种生理唤醒归因于对方对自己的吸引力，而非环境因素。这种现象在多个领域都有重要应用：

1. 约会场景：运动后的心跳加速可能被误认为是对约会对象的心动，因此许多约会活动会安排在运动之后进行。

2. 紧急情况：在紧急情况下的相互帮助更容易产生亲密感，这就是为什么共同经历危险的人往往关系更紧密。

3. 市场营销：恐怖电影、惊险游乐设施旁边的浪漫邂逅场景设计，正是利用了这一效应。

理解吊桥效应有助于我们更理性地认识自己的情感反应，避免被错误的生理信号误导。同时，它也提醒我们在做重要决策时，要注意区分真实的情感反应和环境诱发的生理变化。`;

    await connection.query(
      'UPDATE psychological_effects SET experiment_detail = ?, explanation = ? WHERE name = ?',
      [craneExperiment, craneExplanation, '吊桥效应']
    );
    console.log('✓ 吊桥效应内容已更新');

    // 添加锚定效应
    const anchoringExperiment = JSON.stringify({
      title: "幸运轮盘实验",
      content: "1974年，卡尼曼和特沃斯基设计了一个巧妙的实验。他们在一个课堂上让学生转动一个带有0到100数字的幸运轮盘，然后问学生：联合国中非洲国家所占的比例是多少？结果显示，转到数字较高的学生（如65、78）给出的估计值平均约为45%，而转到数字较低的学生（如12、23）给出的估计值平均约为25%。这个实验清楚表明，即使是完全随机的数字（锚点），也能显著影响人们的判断。"
    });
    
    const anchoringExplanation = `锚定效应是认知心理学中最为稳健的发现之一，它揭示了人类判断中的系统性偏差。

锚定效应的机制主要包括：

1. 可及性启发式：人们会从锚点开始进行不充分的调整，调整的幅度往往不够。

2. 选择性通达：与锚点相关的信息更容易被想起，从而影响判断。

3. 论证产生：锚点会激发与之一致的论证，抑制与之一致的反驳。

在实际生活中，锚定效应无处不在：

- 谈判策略：先提出极端报价的一方往往能获得更有利的结果。
- 定价策略：原价划掉后的高价往往让人觉得折扣很划算。
- 健康评估：医生给出的初始诊断会影响后续的检查和判断。

克服锚定效应需要我们有意识地提醒自己考虑替代方案，并主动寻找与锚点不同的信息。`;

    await connection.query(
      `INSERT INTO psychological_effects (name, proposer, description, experiment_detail, explanation) 
       SELECT ?, ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM psychological_effects WHERE name = ?)`,
      ['锚定效应', '丹尼尔·卡尼曼 & 阿莫斯·特沃斯基', '锚定效应是指人们在决策时，会过度依赖最先获得的信息（锚点），即使这个信息与决策无关。', anchoringExperiment, anchoringExplanation, '锚定效应']
    );
    console.log('✓ 锚定效应已添加');

    // 添加损失厌恶
    const lossExperiment = JSON.stringify({
      title: "最后通牒博弈实验",
      content: "在最后通牒博弈实验中，两个参与者被分配10美元。提议者提出分钱方案，响应者可以接受或拒绝。如果拒绝，两人都什么都得不到。经济学理性人假设预测响应者会接受任何正数，因为有总比没有好。\n\n但实际结果却大相径庭：大多数响应者会拒绝低于2-3美元的提议，他们宁愿什么都得不到也不愿接受被视为不公平的分配。这显示了人们对损失的强烈厌恶。"
    });
    
    const lossExplanation = `损失厌恶深深根植于人类的进化历程中。在远古时代，对威胁的敏感比对机会的敏感更能提高生存概率。

损失厌恶的应用领域：

1. 投资理财：投资者往往过早卖出盈利股票，却长期持有亏损股票。

2. 营销策略：强调「不要错过」比强调「获得」更有效。

3. 健康行为：人们对疾病威胁的反应比对健康收益更强烈。

4. 谈判技巧：框架效应——将条款表述为「损失」而非「未获得」往往更有效。

理解损失厌恶有助于我们识别自身的决策偏见，在面对损失时保持冷静。`;

    await connection.query(
      `INSERT INTO psychological_effects (name, proposer, description, experiment_detail, explanation) 
       SELECT ?, ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM psychological_effects WHERE name = ?)`,
      ['损失厌恶', '丹尼尔·卡尼曼 & 阿莫斯·特沃斯基', '损失厌恶是指人们面对同样数量的损失和收益时，损失带来的痛苦感远大于等量收益带来的愉悦感。', lossExperiment, lossExplanation, '损失厌恶']
    );
    console.log('✓ 损失厌恶已添加');

    // 更新书籍内容简介
    const bookSummary = JSON.stringify({
      intro: "《思考，快与慢》是诺贝尔经济学奖得主丹尼尔·卡尼曼的代表作，系统性地介绍了影响人类判断与决策的认知偏误。本书分为五个部分，深入探讨了大脑的两个系统——快速、直觉、情绪化的系统1，以及缓慢、理性、逻辑化的系统2之间的互动关系。\n\n卡尼曼通过丰富的实验案例和研究成果，揭示了人类思维中存在的系统性偏差。他指出，尽管系统1为我们提供了快速、自动的判断，但它也容易导致各种思维错误；而系统2虽然更加理性，却常常懒惰且容易疲劳。\n\n本书不仅是一部学术著作，更是一本实用的人生指南，帮助读者理解自己在生活、工作、投资等各个领域可能犯下的决策错误。",
      highlights: ["深入理解大脑的两种思维模式", "识别和避免常见认知偏误", "提升判断质量和决策能力", "诺贝尔奖得主的毕生研究精华"]
    });

    await connection.query(
      'UPDATE book_summaries SET summary_content = ? WHERE book_id = 1',
      [bookSummary]
    );
    console.log('✓ 《思考，快与慢》简介已更新');

    // 添加《社会心理学》
    await connection.query(
      `INSERT IGNORE INTO books (title, author, isbn, publisher, publish_date)
       VALUES ('社会心理学', '戴维·迈尔斯', '9787515340401', '人民邮电出版社', '2016-01-01')`
    );
    
    const [rows] = await connection.query('SELECT id FROM books WHERE isbn = ?', ['9787515340401']);
    if (rows[0]) {
      const book2Summary = JSON.stringify({
        intro: "《社会心理学》是社会心理学领域的经典教材，作者戴维·迈尔斯运用通俗易懂的语言，将复杂的社会心理学理论与日常生活紧密结合。本书涵盖了社会心理学的核心议题：从社会认知和社会影响，到态度改变和人际吸引，再到群体动力学和文化差异。\n\n迈尔斯在书中详细探讨了：我们如何理解他人？我们如何被他人影响？书中引用了大量实证研究，包括阿希的从众实验、米尔格拉姆的服从实验、津巴多的斯坦福监狱实验等经典案例。\n\n本书不仅适合作为教材使用，也适合任何对人类行为感兴趣的读者。",
        highlights: ["经典实验案例分析", "理论与生活实践结合", "全面覆盖社会心理学核心议题", "生动有趣的写作风格"]
      });
      
      await connection.query(
        'INSERT IGNORE INTO book_summaries (book_id, summary_content) VALUES (?, ?)',
        [rows[0].id, book2Summary]
      );
    }
    console.log('✓ 《社会心理学》已添加');

    // 添加《亲密关系》
    await connection.query(
      `INSERT IGNORE INTO books (title, author, isbn, publisher, publish_date)
       VALUES ('亲密关系', '罗兰·米勒', '9787550268894', '北京联合出版公司', '2016-05-01')`
    );
    
    const [rows2] = await connection.query('SELECT id FROM books WHERE isbn = ?', ['9787550268894']);
    if (rows2[0]) {
      const book3Summary = JSON.stringify({
        intro: "《亲密关系》是一本关于爱情与亲密关系的心理学著作，作者罗兰·米勒从心理学角度深入分析了亲密关系的发展、维持和破裂的全过程。本书综合了依恋理论、社会交换理论、进化心理学等多个学科的研究成果。\n\n书中探讨了亲密关系中的多个重要议题：为什么我们会爱上特定的人？吸引力是如何产生的？如何建立健康、持久的亲密关系？当关系出现问题时我们该如何应对？\n\n本书特别强调了沟通技巧和冲突解决策略的重要性，帮助情侣和夫妻建立更加稳固和满意的亲密关系。",
        highlights: ["科学的亲密关系理论框架", "丰富的实证研究支撑", "实用的沟通技巧", "建立更健康的亲密关系"]
      });
      
      await connection.query(
        'INSERT IGNORE INTO book_summaries (book_id, summary_content) VALUES (?, ?)',
        [rows2[0].id, book3Summary]
      );
    }
    console.log('✓ 《亲密关系》已添加');

    console.log('\n数据更新完成！刷新页面查看效果。');

  } catch (error) {
    console.error('更新失败:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

updateContent();
