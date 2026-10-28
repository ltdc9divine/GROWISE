(function () {
  const entries = [
    ["meta.title", "Growise — Your Partner in Startup Growth", "Growise — Đồng hành cùng startup tăng trưởng"],
    ["meta.description", "Practical marketing support for HUFLIT senior students building student startups.", "Hỗ trợ marketing thực tế dành cho sinh viên năm cuối HUFLIT đang xây dựng startup sinh viên."],
    ["nav.home", "Home", "Trang chủ"],
    ["nav.about", "About Us", "Về Growise"],
    ["nav.services", "Services", "Dịch vụ"],
    ["nav.planner", "Budget Planner", "Lập kế hoạch ngân sách"],
    ["nav.resources", "Resources", "Tài nguyên"],
    ["nav.consultation", "Consultation", "Tư vấn"],
    ["nav.planGrowth", "Plan your growth", "Lập kế hoạch tăng trưởng"],
    ["home.eyebrow", "Growth, with intention", "Tăng trưởng có định hướng"],
    ["home.hero.title", "Your next<br>chapter <span class=\"lime\">starts</span><br>smarter.", "Chặng đường<br>tiếp theo <span class=\"lime\">bắt đầu</span><br>thông minh hơn."],
    ["home.hero.description", "Good ideas deserve a thoughtful first step. Growise is a marketing-support prototype for HUFLIT seniors with startup ideas or early ventures, offering practical guidance, a budget-planning tool, and learning resources.", "Ý tưởng tốt xứng đáng có bước khởi đầu được cân nhắc. GROWISE là prototype hỗ trợ marketing dành cho sinh viên năm cuối HUFLIT có ý tưởng hoặc startup ở giai đoạn đầu, với hướng dẫn thực tế, công cụ lập ngân sách và tài liệu học tập."],
    ["home.cta.budget", "Build my budget", "Lập ngân sách"],
    ["home.cta.services", "Explore services", "Khám phá dịch vụ"],
    ["home.hero.note", "Built for the next generation of student founders", "Dành cho thế hệ sinh viên khởi nghiệp tiếp theo"],
    ["home.orbit.start", "Start small", "Bắt đầu nhỏ"],
    ["home.orbit.think", "Think", "Nghĩ"],
    ["home.orbit.big", "big.", "lớn."],
    ["home.orbit.purpose", "Spend with purpose", "Chi tiêu đúng mục tiêu"],
    ["home.orbit.waste", "Less waste", "Ít lãng phí"],
    ["home.orbit.count", "Make every move count", "Mỗi bước đi đều có giá trị"],
    ["home.orbit.grow", "Grow wisely ↗", "Tăng trưởng khôn ngoan ↗"],
    ["home.bottom.title", "The smarter way to start", "Khởi đầu thông minh hơn"],
    ["home.metric.clarity", "Start with clarity", "Bắt đầu từ sự rõ ràng"],
    ["home.metric.spend", "Spend intentionally", "Chi tiêu có chủ đích"],
    ["home.metric.learn", "Learn as you grow", "Học hỏi trong quá trình phát triển"],
    ["home.challenge.eyebrow", "The challenge", "Thách thức"],
    ["home.challenge.title", "Big ambition.<br><span class=\"lime\">Limited resources.</span>", "Khát vọng lớn.<br><span class=\"lime\">Nguồn lực giới hạn.</span>"],
    ["home.challenge.description", "Starting a business is hard enough. Marketing shouldn't feel like guesswork. Growise turns confusing choices into a clearer next step.", "Khởi nghiệp vốn đã nhiều thử thách. Marketing không nên là những quyết định mò mẫm. Growise giúp bạn hiểu rõ lựa chọn và xác định bước tiếp theo."],
    ["home.card.people.title", "Finding your people", "Tìm đúng khách hàng"],
    ["home.card.number.clarity", "01 / CLARITY", "01 / RÕ RÀNG"],
    ["home.card.people.description", "Understand who your customers are and where they are most likely to discover your brand.", "Tìm hiểu khách hàng của bạn là ai và họ thường khám phá thương hiệu ở đâu."],
    ["home.card.channels.title", "Choosing the right channels", "Chọn đúng kênh"],
    ["home.card.number.focus", "02 / FOCUS", "02 / TẬP TRUNG"],
    ["home.card.channels.description", "Focus your time and money on channels that fit your product, audience, and current stage.", "Tập trung thời gian và ngân sách vào những kênh phù hợp với sản phẩm, khách hàng và giai đoạn hiện tại."],
    ["home.card.budget.title", "Making budget count", "Sử dụng ngân sách hiệu quả"],
    ["home.card.number.control", "03 / CONTROL", "03 / KIỂM SOÁT"],
    ["home.card.budget.description", "Plan small experiments, track meaningful signals, and avoid spending before you learn.", "Lên kế hoạch thử nghiệm nhỏ, theo dõi tín hiệu hữu ích và tránh chi tiêu trước khi tìm hiểu."],
    ["home.visual.strategy", "STRATEGY / 01", "CHIẾN LƯỢC / 01"],
    ["home.visual.balance", "Budget in balance", "Cân đối ngân sách"],
    ["home.visual.learning", "Small steps. Real learning.", "Bước nhỏ. Bài học thật."],
    ["home.why.eyebrow", "Why Growise", "Vì sao chọn Growise"],
    ["home.why.title", "Make your next move a <span class=\"lime\">smart one.</span>", "Để bước đi tiếp theo của bạn <span class=\"lime\">sáng suốt hơn.</span>"],
    ["home.why.practical.title", "Practical, not overwhelming", "Thực tế, không quá tải"],
    ["home.why.practical.description", "Simple frameworks you can apply without a big marketing team.", "Khung hướng dẫn đơn giản, có thể áp dụng mà không cần đội ngũ marketing lớn."],
    ["home.why.budget.title", "Built around your budget", "Phù hợp với ngân sách"],
    ["home.why.budget.description", "Recommendations start with your actual resources—not an unrealistic ideal.", "Gợi ý bắt đầu từ nguồn lực thực tế, không phải một mục tiêu xa vời."],
    ["home.why.learn.title", "Learn, test, improve", "Học hỏi, thử nghiệm, cải thiện"],
    ["home.why.learn.description", "Make decisions based on customer feedback and useful performance metrics.", "Đưa ra quyết định dựa trên phản hồi khách hàng và các chỉ số hiệu quả hữu ích."],
    ["home.why.cta", "Our approach", "Cách tiếp cận"],
    ["home.toolkit.eyebrow", "Your growth toolkit", "Bộ công cụ tăng trưởng"],
    ["home.toolkit.title", "Everything starts<br>with a <span class=\"lime\">plan.</span>", "Mọi hành trình<br>bắt đầu bằng <span class=\"lime\">một kế hoạch.</span>"],
    ["home.toolkit.description", "Start with a self-guided budget plan. Explore our services and learning resources whenever you need a clearer direction.", "Bắt đầu với kế hoạch ngân sách tự thực hiện. Tìm hiểu dịch vụ và tài liệu khi bạn cần xác định hướng đi rõ ràng hơn."],
    ["home.toolkit.strategy.title", "Marketing strategy", "Chiến lược marketing"],
    ["home.toolkit.strategy.description", "Find a direction that matches your customers, goals, and stage.", "Tìm hướng đi phù hợp với khách hàng, mục tiêu và giai đoạn của bạn."],
    ["home.toolkit.budget.title", "Budget planner", "Công cụ lập ngân sách"],
    ["home.toolkit.budget.description", "Turn a monthly budget into a practical starting allocation.", "Biến ngân sách hàng tháng thành phương án phân bổ để bắt đầu."],
    ["home.toolkit.resources.title", "Founder resources", "Tài liệu cho nhà sáng lập"],
    ["home.toolkit.resources.description", "Learn the essentials through bite-sized, actionable guides.", "Tìm hiểu kiến thức nền tảng qua các hướng dẫn ngắn gọn, thiết thực."],
    ["home.toolkit.servicesLink", "Explore services ↗", "Khám phá dịch vụ ↗"],
    ["home.toolkit.planLink", "Build a plan ↗", "Lập kế hoạch ↗"],
    ["home.toolkit.learnLink", "Start learning ↗", "Bắt đầu tìm hiểu ↗"],
    ["home.cta.eyebrow", "Your idea deserves a plan", "Ý tưởng của bạn xứng đáng có kế hoạch"],
    ["home.cta.title", "Let's make your next move count.", "Hãy biến bước đi tiếp theo thành dấu ấn."],
    ["home.cta.description", "Start with a simple budget plan or tell us what's holding your startup back.", "Bắt đầu bằng kế hoạch ngân sách đơn giản hoặc chia sẻ điều đang cản trở startup của bạn."],
    ["home.cta.consultation", "Talk to Growise ↗", "Trao đổi với Growise ↗"],
    ["about.hero.eyebrow", "About Growise / 01", "Về Growise / 01"],
    ["about.hero.title", "Growth is not luck.<br>It's <span class=\"lime\">a practice.</span>", "Tăng trưởng không chỉ nhờ may mắn.<br>Đó là <span class=\"lime\">một quá trình rèn luyện.</span>"],
    ["about.hero.description", "Growise is an academic website prototype exploring how accessible marketing guidance may support HUFLIT seniors who are considering or building student startups.", "GROWISE là prototype website học thuật tìm hiểu cách hướng dẫn marketing dễ tiếp cận có thể hỗ trợ sinh viên năm cuối HUFLIT đang cân nhắc khởi nghiệp hoặc xây dựng startup sinh viên."],
    ["about.story.eyebrow", "Our story", "Câu chuyện của chúng tôi"],
    ["about.story.title", "Good ideas need more than <span class=\"lime\">good timing.</span>", "Ý tưởng tốt cần nhiều hơn <span class=\"lime\">thời điểm thuận lợi.</span>"],
    ["about.story.p1", "Early-stage founders may need to decide whom to serve, which channel to try, how to plan a limited budget, and what to measure. These are the practical questions this project is designed to help users explore; they are not presented as proven research findings.", "Nhà sáng lập ở giai đoạn đầu có thể cần xác định khách hàng, chọn kênh thử nghiệm, lập kế hoạch cho ngân sách hạn chế và quyết định chỉ số cần theo dõi. Đây là những câu hỏi thực tiễn mà dự án hướng đến hỗ trợ người dùng tìm hiểu, không phải kết quả nghiên cứu đã được chứng minh."],
    ["about.story.p2", "The research topic is “Exploring Factors Affecting Start-up Success among HUFLIT Seniors: Developing a Marketing Support Website for Student Start-ups.” Growise is the website prototype developed for that project.", "Đề tài nghiên cứu là “Tìm hiểu các yếu tố ảnh hưởng đến thành công của startup trong sinh viên năm cuối HUFLIT: Phát triển website hỗ trợ marketing cho startup sinh viên.” GROWISE là prototype website được xây dựng trong khuôn khổ đề tài này."],
    ["about.story.promise", "This prototype offers educational guidance and planning tools. It is not a professional marketing agency, does not verify market assumptions, and cannot guarantee business or campaign results.", "Prototype này cung cấp hướng dẫn học tập và công cụ lập kế hoạch. Đây không phải agency marketing chuyên nghiệp, không xác minh các giả định thị trường và không thể đảm bảo kết quả kinh doanh hay chiến dịch."],
    ["about.values.mission.title", "Our mission", "Sứ mệnh"],
    ["about.values.mission.description", "Make useful marketing knowledge and practical planning more accessible to student founders.", "Giúp nhà sáng lập sinh viên tiếp cận kiến thức marketing hữu ích và cách lập kế hoạch thực tế dễ dàng hơn."],
    ["about.values.vision.title", "Our vision", "Tầm nhìn"],
    ["about.values.vision.description", "Become a trusted starting point for students building thoughtful, sustainable ventures.", "Trở thành điểm khởi đầu đáng tin cậy cho sinh viên xây dựng dự án kinh doanh có định hướng và bền vững."],
    ["about.values.principles.title", "Our principles", "Nguyên tắc"],
    ["about.values.principles.description", "Clarity over hype. Evidence over assumptions. Learning before scaling.", "Ưu tiên sự rõ ràng thay vì phô trương. Bằng chứng thay vì giả định. Học hỏi trước khi mở rộng."],
    ["about.audience.eyebrow", "Who we serve", "Đối tượng chúng tôi hướng đến"],
    ["about.audience.title", "Made for the <span class=\"lime\">first steps.</span>", "Dành cho những <span class=\"lime\">bước khởi đầu.</span>"],
    ["about.audience.description", "Our intended audience is senior HUFLIT students exploring entrepreneurship and early-stage student businesses.", "Đối tượng hướng đến là sinh viên năm cuối HUFLIT đang tìm hiểu khởi nghiệp và các dự án kinh doanh sinh viên ở giai đoạn đầu."],
    ["about.audience.idea.title", "Idea-stage founders", "Nhà sáng lập ở giai đoạn ý tưởng"],
    ["about.audience.idea.description", "Students who need to validate a business idea and learn who might buy it.", "Sinh viên cần kiểm chứng ý tưởng kinh doanh và tìm hiểu ai có thể quan tâm đến sản phẩm."],
    ["about.audience.early.title", "Early-stage startups", "Startup giai đoạn đầu"],
    ["about.audience.early.description", "Small teams beginning to promote a product and looking for a repeatable approach.", "Nhóm nhỏ mới bắt đầu quảng bá sản phẩm và muốn tìm cách làm có thể duy trì."],
    ["about.audience.business.title", "Student-led businesses", "Doanh nghiệp do sinh viên vận hành"],
    ["about.audience.business.description", "Founders who want to understand results and make limited marketing funds go further.", "Nhà sáng lập muốn hiểu kết quả và sử dụng hiệu quả nguồn ngân sách marketing hạn chế."],
    ["about.cta.title", "Small teams can make thoughtful moves.", "Nhóm nhỏ vẫn có thể đưa ra những bước đi có cân nhắc."],
    ["about.cta.description", "Explore the tools and services built around your current stage.", "Khám phá công cụ và dịch vụ phù hợp với giai đoạn hiện tại của bạn."],
    ["about.cta.services", "Explore services ↗", "Khám phá dịch vụ ↗"],
    ["services.hero.eyebrow", "What we do / 02", "Chúng tôi làm gì / 02"],
    ["services.hero.title", "Less guesswork.<br><span class=\"lime\">More direction.</span>", "Bớt phỏng đoán.<br><span class=\"lime\">Thêm định hướng.</span>"],
    ["services.hero.description", "Four focused support areas designed to help student startups move from scattered marketing activity to a clearer plan.", "Bốn nhóm hỗ trợ tập trung giúp startup sinh viên chuyển từ hoạt động marketing rời rạc sang một kế hoạch rõ ràng hơn."],
    ["services.strategy.title", "Marketing Strategy Consultation", "Tư vấn chiến lược marketing"],
    ["services.strategy.description", "Use the details you provide to outline a priority audience, a positioning question, and channels to investigate. Intended output: discussion notes for your next decision; assumptions still need validation.", "Dựa trên thông tin bạn cung cấp, phác thảo nhóm khách hàng ưu tiên, câu hỏi về định vị và các kênh cần tìm hiểu. Đầu ra dự kiến là ghi chú hỗ trợ quyết định tiếp theo; các giả định vẫn cần được kiểm chứng."],
    ["services.plan.title", "Marketing Plan Development", "Xây dựng kế hoạch marketing"],
    ["services.plan.description", "Turn a stated goal into a draft list of priorities, suggested timing, content prompts, and review points. It is a planning aid—not a managed campaign or a promise of results.", "Chuyển mục tiêu bạn nêu thành bản nháp gồm các ưu tiên, thời điểm gợi ý, gợi ý nội dung và mốc đánh giá. Đây là công cụ hỗ trợ lập kế hoạch, không phải dịch vụ triển khai chiến dịch hay cam kết kết quả."],
    ["services.budget.title", "Budget Optimization", "Tối ưu ngân sách"],
    ["services.budget.description", "Review an illustrative starting allocation, identify spending limits, and consider small tests before committing more. The planner uses simple assumptions; check any plan against your costs and margins.", "Xem phương án phân bổ ban đầu mang tính minh họa, xác định giới hạn chi tiêu và cân nhắc thử nghiệm nhỏ trước khi đầu tư thêm. Công cụ dùng các giả định đơn giản; hãy đối chiếu kế hoạch với chi phí và biên lợi nhuận thực tế."],
    ["services.review.title", "Campaign Performance Review", "Đánh giá hiệu quả chiến dịch"],
    ["services.review.description", "When you have campaign data to review, summarize relevant signals—such as reach, inquiries, or sales—and outline a possible next test. Conclusions depend on the data provided and do not predict future performance.", "Khi có dữ liệu chiến dịch, tổng hợp các tín hiệu phù hợp như lượt tiếp cận, yêu cầu hoặc doanh số và đề xuất thử nghiệm tiếp theo để cân nhắc. Kết luận phụ thuộc vào dữ liệu được cung cấp và không dự đoán hiệu quả tương lai."],
    ["services.process.eyebrow", "How it works", "Quy trình hoạt động"],
    ["services.process.title", "A clear path from idea to <span class=\"lime\">action.</span>", "Lộ trình rõ ràng từ ý tưởng đến <span class=\"lime\">hành động.</span>"],
    ["services.step1.title", "Understand", "Tìm hiểu"],
    ["services.step1.label", "STEP 01", "BƯỚC 01"],
    ["services.step1.description", "Describe your product, audience, current challenges, and constraints.", "Mô tả sản phẩm, khách hàng, thách thức hiện tại và những giới hạn của bạn."],
    ["services.step2.title", "Prioritize", "Xác định ưu tiên"],
    ["services.step2.label", "STEP 02", "BƯỚC 02"],
    ["services.step2.description", "Choose the most important marketing question to address first.", "Chọn vấn đề marketing quan trọng nhất cần giải quyết trước."],
    ["services.step3.title", "Learn & adjust", "Học hỏi và điều chỉnh"],
    ["services.step3.label", "STEP 03", "BƯỚC 03"],
    ["services.step3.description", "Run manageable experiments and use results to decide what comes next.", "Thực hiện thử nghiệm vừa sức và dựa vào kết quả để quyết định bước tiếp theo."],
    ["services.cta.title", "Not sure what you need yet?", "Bạn chưa chắc mình cần gì?"],
    ["services.cta.description", "Start with the budget planner. It gives you a structured first draft, not a one-size-fits-all answer.", "Hãy bắt đầu với công cụ lập ngân sách. Công cụ giúp tạo bản nháp có cấu trúc, không phải đáp án phù hợp với mọi trường hợp."],
    ["services.cta.planner", "Open budget planner ↗", "Mở công cụ lập ngân sách ↗"],
    ["planner.hero.eyebrow", "Interactive tool / 03", "Công cụ tương tác / 03"],
    ["planner.hero.title", "Your budget.<br>Your <span class=\"lime\">next move.</span>", "Ngân sách của bạn.<br><span class=\"lime\">Bước đi tiếp theo.</span>"],
    ["planner.hero.description", "Create an illustrative starting allocation from your budget, industry, goal, and current channels. Use it to frame a small test, then revisit the assumptions as you learn; it is not a revenue forecast.", "Tạo phương án phân bổ ban đầu mang tính minh họa dựa trên ngân sách, lĩnh vực, mục tiêu và kênh hiện tại. Dùng phương án này để định hình thử nghiệm nhỏ rồi xem lại giả định khi có thêm hiểu biết; đây không phải dự báo doanh thu."],
    ["planner.form.title", "Tell us about your startup", "Cho chúng tôi biết về startup của bạn"],
    ["planner.form.description", "Choose the options closest to your current situation. The result is a draft based on simple assumptions, not a forecast or a guaranteed recommendation.", "Chọn các phương án gần với tình hình hiện tại của bạn. Kết quả là bản nháp dựa trên giả định đơn giản, không phải dự báo hay khuyến nghị đảm bảo hiệu quả."],
    ["planner.fields.startupName", "Startup name", "Tên startup"],
    ["planner.placeholder.startupName", "e.g. Mộc Bakery", "Ví dụ: Tiệm bánh Mộc"],
    ["planner.fields.industry", "Business industry", "Lĩnh vực kinh doanh"],
    ["planner.industry.product", "Consumer product", "Sản phẩm tiêu dùng"],
    ["planner.industry.food", "Food & beverage", "Ẩm thực và đồ uống"],
    ["planner.industry.services", "Services", "Dịch vụ"],
    ["planner.industry.education", "Education", "Giáo dục"],
    ["planner.industry.fashion", "Fashion & beauty", "Thời trang và làm đẹp"],
    ["planner.industry.technology", "Technology / digital", "Công nghệ / kỹ thuật số"],
    ["planner.fields.product", "Product or service", "Sản phẩm hoặc dịch vụ"],
    ["planner.placeholder.product", "What are you offering?", "Bạn đang cung cấp sản phẩm hoặc dịch vụ gì?"],
    ["planner.fields.audience", "Target customers", "Khách hàng mục tiêu"],
    ["planner.audience.students", "University students", "Sinh viên đại học"],
    ["planner.audience.professionals", "Young professionals", "Người đi làm trẻ"],
    ["planner.audience.community", "Local community", "Cộng đồng địa phương"],
    ["planner.audience.families", "Parents and families", "Phụ huynh và gia đình"],
    ["planner.audience.businesses", "Businesses", "Doanh nghiệp"],
    ["planner.audience.general", "General consumers", "Người tiêu dùng nói chung"],
    ["planner.fields.goal", "Main marketing objective", "Mục tiêu marketing chính"],
    ["planner.goal.awareness", "Build brand awareness", "Tăng nhận biết thương hiệu"],
    ["planner.goal.engagement", "Increase engagement", "Tăng tương tác"],
    ["planner.goal.leads", "Generate leads / inquiries", "Thu hút khách hàng tiềm năng / yêu cầu tư vấn"],
    ["planner.goal.sales", "Increase sales", "Tăng doanh số"],
    ["planner.fields.channels", "Current marketing channels", "Kênh marketing hiện tại"],
    ["planner.channels.none", "Just starting — no channels yet", "Mới bắt đầu — chưa có kênh nào"],
    ["planner.channels.social", "Social media only", "Chỉ sử dụng mạng xã hội"],
    ["planner.channels.marketplace", "Marketplace / e-commerce", "Sàn thương mại điện tử"],
    ["planner.channels.mixed", "Social media + other channels", "Mạng xã hội và các kênh khác"],
    ["planner.fields.monthlyBudget", "Monthly marketing budget (VND)", "Ngân sách marketing hàng tháng (VND)"],
    ["planner.budget.generate", "Generate my plan ↗", "Tạo kế hoạch ↗"],
    ["planner.result.eyebrow", "Your first-draft allocation", "Phân bổ ngân sách bản nháp"],
    ["planner.result.initialTitle", "A little budget. A focused start.", "Ngân sách nhỏ. Khởi đầu tập trung."],
    ["planner.result.initialIntro", "Begin with consistent content and small experiments. Learn what resonates before increasing spend.", "Bắt đầu bằng nội dung đều đặn và thử nghiệm nhỏ. Tìm hiểu điều phù hợp trước khi tăng chi tiêu."],
    ["planner.result.title.small", "Start lean. Learn fast.", "Bắt đầu tinh gọn. Học hỏi nhanh."],
    ["planner.result.title.medium", "A focused start with room to learn.", "Khởi đầu tập trung, vẫn linh hoạt để học hỏi."],
    ["planner.result.title.large", "Test deliberately, then scale carefully.", "Thử nghiệm có mục tiêu, rồi mở rộng thận trọng."],
    ["planner.result.intro.small", "Keep the draft lean: speak with potential customers and try useful organic content before paying to reach more people. Treat the allocation as a prompt for discussion, not a spending instruction.", "Giữ bản nháp tinh gọn: trò chuyện với khách hàng tiềm năng và thử nội dung tự nhiên hữu ích trước khi trả phí để tiếp cận thêm người. Hãy xem tỷ lệ phân bổ là gợi ý để cân nhắc, không phải chỉ dẫn chi tiêu."],
    ["planner.result.intro.medium", "Start with one small test and choose a metric tied to your goal. Keep room to learn and adjust; the displayed amounts are illustrative, not expected returns.", "Bắt đầu bằng một thử nghiệm nhỏ và chọn chỉ số gắn với mục tiêu. Dành chỗ để học hỏi, điều chỉnh; số tiền hiển thị chỉ mang tính minh họa, không phải lợi nhuận dự kiến."],
    ["planner.result.intro.large", "Break the draft into clearly scoped tests. Review actual costs and evidence before increasing spend; a larger budget does not guarantee better results.", "Chia bản nháp thành các thử nghiệm có phạm vi rõ ràng. Xem xét chi phí và bằng chứng thực tế trước khi tăng chi tiêu; ngân sách lớn hơn không đảm bảo kết quả tốt hơn."],
    ["planner.budget.label", "Monthly budget", "Ngân sách hàng tháng"],
    ["planner.allocation.content", "Content & creative", "Nội dung và sáng tạo"],
    ["planner.allocation.promotion", "Paid promotion", "Quảng bá trả phí"],
    ["planner.allocation.research", "Customer research", "Nghiên cứu khách hàng"],
    ["planner.allocation.reserve", "Testing & reserve", "Thử nghiệm và dự phòng"],
    ["planner.kpi.test", "Suggested first test", "Thời gian thử nghiệm gợi ý"],
    ["planner.kpi.duration", "7–14 days", "7–14 ngày"],
    ["planner.kpi.metric", "Primary metric", "Chỉ số chính"],
    ["planner.metric.awareness", "Reach & saves", "Lượt tiếp cận và lượt lưu"],
    ["planner.metric.engagement", "Engagement", "Tương tác"],
    ["planner.metric.leads", "Qualified leads", "Khách hàng tiềm năng phù hợp"],
    ["planner.metric.sales", "Conversion rate", "Tỷ lệ chuyển đổi"],
    ["planner.priority.channel.none", "Choose one main channel where your target customers already spend time; do not launch everywhere at once.", "Chọn một kênh chính nơi khách hàng mục tiêu thường hoạt động; đừng triển khai mọi nơi cùng lúc."],
    ["planner.priority.channel.social", "Keep posting consistently and test two content formats before adding another channel.", "Đăng nội dung đều đặn và thử hai định dạng trước khi thêm kênh mới."],
    ["planner.priority.channel.other", "Review which current channel brings meaningful inquiries or sales before splitting spend further.", "Đánh giá kênh hiện tại nào mang lại yêu cầu tư vấn hoặc doanh số đáng kể trước khi chia nhỏ ngân sách."],
    ["planner.priority.industry.food", "Use clear product photos, menus, customer reviews, and location information to help nearby customers decide.", "Dùng ảnh sản phẩm rõ nét, thực đơn, đánh giá của khách hàng và thông tin địa điểm để hỗ trợ khách gần bạn đưa ra quyết định."],
    ["planner.priority.industry.fashion", "Show the product in use, explain fit or quality, and make the path to purchase easy.", "Cho thấy sản phẩm khi sử dụng, giải thích kiểu dáng hoặc chất lượng và giúp khách dễ mua hàng."],
    ["planner.priority.industry.service", "Share proof of your process, answer common questions, and make contacting you simple.", "Chia sẻ quy trình thực hiện, trả lời câu hỏi thường gặp và giúp khách dễ dàng liên hệ."],
    ["planner.priority.industry.general", "Create useful content that explains the problem you solve and why your offer is relevant.", "Tạo nội dung hữu ích giải thích vấn đề bạn giải quyết và vì sao sản phẩm phù hợp."],
    ["planner.priority.goal.awareness", "For an awareness test, choose a discovery signal such as relevant reach or profile visits. These show exposure, not whether people will buy.", "Với thử nghiệm tăng nhận biết, chọn tín hiệu khám phá như lượt tiếp cận phù hợp hoặc lượt xem hồ sơ. Các chỉ số này phản ánh mức độ tiếp xúc, không cho biết khách sẽ mua hàng."],
    ["planner.priority.goal.engagement", "Compare saves, shares, meaningful comments, and profile visits across content formats.", "So sánh lượt lưu, lượt chia sẻ, bình luận có ý nghĩa và lượt xem hồ sơ giữa các định dạng nội dung."],
    ["planner.priority.goal.leads", "Track qualified inquiries and the cost per inquiry; follow up quickly.", "Theo dõi yêu cầu phù hợp và chi phí cho mỗi yêu cầu; phản hồi sớm."],
    ["planner.priority.goal.sales", "Where you can track them, compare orders and conversion with the costs and gross margin behind each sale.", "Nếu có thể theo dõi, hãy đối chiếu đơn hàng và tỷ lệ chuyển đổi với chi phí cùng biên lợi nhuận gộp của mỗi giao dịch."],
    ["planner.priority.review", "Review after 7–14 days, write down what you learned, and avoid scaling a campaign based on one good day.", "Đánh giá sau 7–14 ngày, ghi lại điều đã học và tránh mở rộng chiến dịch chỉ vì một ngày có kết quả tốt."],
    ["planner.copy", "Copy plan summary ↗", "Sao chép tóm tắt kế hoạch ↗"],
    ["planner.download", "Download TXT ↗", "Tải tệp TXT ↗"],
    ["planner.support", "Get support ↗", "Nhận hỗ trợ ↗"],
    ["planner.priority.initial1", "Publish useful, consistent content for one clearly defined audience.", "Đăng nội dung hữu ích, đều đặn cho một nhóm khách hàng mục tiêu rõ ràng."],
    ["planner.priority.initial2", "Test one small paid campaign only after you have a clear message.", "Chỉ thử một chiến dịch trả phí nhỏ sau khi đã có thông điệp rõ ràng."],
    ["planner.priority.initial3", "Track inquiries and customer feedback—not likes alone.", "Theo dõi yêu cầu và phản hồi của khách hàng, không chỉ lượt thích."],
    ["planner.copy.success", "Plan summary copied.", "Đã sao chép tóm tắt kế hoạch."],
    ["planner.copy.failure", "Could not copy the plan. Please select and copy it manually.", "Không thể sao chép kế hoạch. Vui lòng chọn và sao chép thủ công."],
    ["planner.download.success", "Plan downloaded.", "Đã tải kế hoạch."],
    ["planner.generate.toast", "Your draft plan is updated. Adjust assumptions as you learn.", "Bản nháp kế hoạch đã được cập nhật. Hãy điều chỉnh giả định khi bạn tìm hiểu thêm."],
    ["planner.notice", "Educational draft only: this planner applies fixed starting assumptions. It is not a revenue forecast, financial advice, or a guarantee of campaign results. Check the allocation against your actual costs, margins, customer evidence, and campaign data before spending.", "Chỉ là bản nháp phục vụ học tập: công cụ áp dụng các giả định phân bổ ban đầu cố định. Đây không phải dự báo doanh thu, tư vấn tài chính hay cam kết kết quả chiến dịch. Trước khi chi tiêu, hãy đối chiếu phương án với chi phí, biên lợi nhuận, bằng chứng khách hàng và dữ liệu chiến dịch thực tế."],
    ["planner.resources", "Explore practical guides ↗", "Đọc hướng dẫn thực tế ↗"],
    ["resources.hero.eyebrow", "The founder library / 04", "Thư viện nhà sáng lập / 04"],
    ["resources.hero.title", "Learn the basics.<br><span class=\"lime\">Move with purpose.</span>", "Nắm vững kiến thức nền tảng.<br><span class=\"lime\">Hành động có mục tiêu.</span>"],
    ["resources.hero.description", "Short, practical guides for student founders who want to market thoughtfully, understand their customers, and make limited resources go further.", "Hướng dẫn ngắn gọn, thiết thực dành cho startup sinh viên muốn làm marketing có định hướng, hiểu khách hàng và sử dụng hiệu quả nguồn lực hạn chế."],
    ["resources.filter.all", "All resources", "Tất cả tài liệu"],
    ["resources.filter.strategy", "Strategy", "Chiến lược"],
    ["resources.filter.budget", "Budgeting", "Ngân sách"],
    ["resources.filter.content", "Content", "Nội dung"],
    ["resources.filter.metrics", "Measurement", "Đo lường"],
    ["resources.category.strategy", "STRATEGY", "CHIẾN LƯỢC"],
    ["resources.category.budget", "BUDGETING", "NGÂN SÁCH"],
    ["resources.category.content", "CONTENT", "NỘI DUNG"],
    ["resources.category.metrics", "MEASUREMENT", "ĐO LƯỜNG"],
    ["resources.readTime", "{minutes} MIN READ", "ĐỌC {minutes} PHÚT"],
    ["resources.readTime.3", "3 MIN READ", "ĐỌC 3 PHÚT"],
    ["resources.readTime.4", "4 MIN READ", "ĐỌC 4 PHÚT"],
    ["resources.readTime.5", "5 MIN READ", "ĐỌC 5 PHÚT"],
    ["resources.readTime.6", "6 MIN READ", "ĐỌC 6 PHÚT"],
    ["resources.article.budget.title", "How to market your startup on a limited budget", "Cách marketing startup với ngân sách hạn chế"],
    ["resources.article.budget.description", "Prioritize free channels, create reusable content, and test before you scale.", "Ưu tiên kênh miễn phí, tạo nội dung có thể tái sử dụng và thử nghiệm trước khi mở rộng."],
    ["resources.article.audience.title", "Find your first target customer", "Tìm khách hàng mục tiêu đầu tiên"],
    ["resources.article.audience.description", "Move beyond “everyone” and define a group whose needs you can actually serve.", "Đừng nhắm đến “tất cả mọi người”; hãy xác định nhóm khách hàng mà bạn có thể phục vụ."],
    ["resources.article.content.title", "Build a simple content system", "Xây dựng hệ thống nội dung đơn giản"],
    ["resources.article.content.description", "Use a few repeatable content pillars to stay consistent without burning out.", "Dùng một vài nhóm chủ đề có thể lặp lại để duy trì đều đặn mà không quá tải."],
    ["resources.article.metrics.title", "Metrics that matter in the beginning", "Những chỉ số quan trọng khi mới bắt đầu"],
    ["resources.article.metrics.description", "Choose metrics that connect marketing activity to real customer behavior.", "Chọn chỉ số liên kết hoạt động marketing với hành vi thực tế của khách hàng."],
    ["resources.article.validate.title", "Validate an idea before spending more", "Kiểm chứng ý tưởng trước khi chi thêm"],
    ["resources.article.validate.description", "Use conversations, prototypes, and small tests to learn what customers value.", "Trò chuyện, làm mẫu thử và thử nghiệm nhỏ để tìm hiểu điều khách hàng coi trọng."],
    ["resources.article.experiment.title", "Plan a 30-day marketing experiment", "Lập kế hoạch thử nghiệm marketing trong 30 ngày"],
    ["resources.article.experiment.description", "Set one goal, define a small test, and decide in advance what success means.", "Đặt một mục tiêu, xác định thử nghiệm nhỏ và thống nhất trước thế nào là kết quả tốt."],
    ["resources.readGuide", "Read the guide ↗", "Đọc hướng dẫn ↗"],
    ["resources.empty", "No resources match this filter.", "Không có tài liệu phù hợp với bộ lọc này."],
    ["resources.modal.eyebrow", "Growise field notes", "Ghi chú từ Growise"],
    ["resources.modal.placeholderTitle", "Guide title", "Tiêu đề hướng dẫn"],
    ["resources.modal.close", "Close guide", "Đóng hướng dẫn"],
    ["resources.modal.planner", "Build your plan ↗", "Lập kế hoạch ↗"],
    ["articles.budget.title", "How to market your startup on a limited budget", "Cách marketing startup với ngân sách hạn chế"],
    ["articles.budget.intro", "A small budget is a reason to prioritize—not a reason to disappear.", "Ngân sách nhỏ là lý do để xác định ưu tiên, không phải lý do để ngừng xuất hiện."],
    ["articles.budget.1.title", "1. Start with one audience", "1. Bắt đầu với một nhóm khách hàng"],
    ["articles.budget.1.body", "Choose a specific group and learn what they care about. A message for everyone usually feels relevant to no one.", "Chọn một nhóm cụ thể và tìm hiểu điều họ quan tâm. Thông điệp dành cho tất cả thường không thật sự phù hợp với ai."],
    ["articles.budget.2.title", "2. Use a channel you can maintain", "2. Chọn kênh bạn có thể duy trì"],
    ["articles.budget.2.body", "Pick one or two places where your audience already spends time. Consistency and useful information matter more than being everywhere.", "Chọn một hoặc hai nơi khách hàng thường lui tới. Duy trì đều đặn và chia sẻ thông tin hữu ích quan trọng hơn việc xuất hiện ở mọi nơi."],
    ["articles.budget.3.title", "3. Create reusable content", "3. Tạo nội dung có thể tái sử dụng"],
    ["articles.budget.3.body", "Turn customer questions into short posts, demonstrations, FAQs, and testimonials—with permission.", "Biến câu hỏi của khách thành bài đăng ngắn, phần giới thiệu sản phẩm, câu hỏi thường gặp và chia sẻ từ khách hàng — khi đã được cho phép."],
    ["articles.budget.4.title", "4. Test before scaling", "4. Thử nghiệm trước khi mở rộng"],
    ["articles.budget.4.body", "Set a small spending cap and one clear objective. Compare results against your baseline before spending more.", "Đặt giới hạn chi tiêu nhỏ và một mục tiêu rõ ràng. So sánh kết quả với mức cơ sở trước khi chi thêm."],
    ["articles.budget.5.title", "5. Track behavior, not vanity alone", "5. Theo dõi hành vi, không chỉ chỉ số bề nổi"],
    ["articles.budget.5.body", "Record inquiries, qualified leads, purchases, and customer feedback—not likes in isolation.", "Ghi nhận yêu cầu, khách hàng tiềm năng phù hợp, giao dịch và phản hồi — không chỉ lượt thích riêng lẻ."],
    ["articles.audience.title", "Find your first target customer", "Tìm khách hàng mục tiêu đầu tiên"],
    ["articles.audience.intro", "A target audience is a practical hypothesis you can test, not a permanent label.", "Khách hàng mục tiêu là giả thuyết thực tế để kiểm chứng, không phải nhãn cố định mãi mãi."],
    ["articles.audience.1.title", "1. Describe a real situation", "1. Mô tả tình huống thực tế"],
    ["articles.audience.1.body", "Who experiences the problem, when does it happen, and what do they do today?", "Ai đang gặp vấn đề, vấn đề xuất hiện khi nào và hiện họ đang giải quyết ra sao?"],
    ["articles.audience.2.title", "2. Talk to potential customers", "2. Trò chuyện với khách hàng tiềm năng"],
    ["articles.audience.2.body", "Ask about their behavior and frustrations before pitching your idea. Avoid leading questions.", "Tìm hiểu hành vi và khó khăn của họ trước khi giới thiệu ý tưởng. Tránh đặt câu hỏi dẫn dắt."],
    ["articles.audience.3.title", "3. Find a reachable group", "3. Tìm nhóm khách hàng bạn có thể tiếp cận"],
    ["articles.audience.3.body", "Start with people you can actually interview, observe, or reach through a relevant community.", "Bắt đầu với những người bạn có thể phỏng vấn, quan sát hoặc tiếp cận qua cộng đồng phù hợp."],
    ["articles.audience.4.title", "4. Refine with evidence", "4. Điều chỉnh dựa trên bằng chứng"],
    ["articles.audience.4.body", "Notice repeated needs, objections, and buying triggers. Update your assumptions as you learn.", "Chú ý các nhu cầu, băn khoăn và động lực mua hàng lặp lại. Cập nhật giả định khi bạn hiểu thêm."],
    ["articles.content.title", "Build a simple content system", "Xây dựng hệ thống nội dung đơn giản"],
    ["articles.content.intro", "A lightweight system makes consistency easier than inventing every post from scratch.", "Một hệ thống gọn nhẹ giúp duy trì đều đặn dễ hơn việc nghĩ ý tưởng mới cho từng bài."],
    ["articles.content.1.title", "1. Pick three content pillars", "1. Chọn ba nhóm chủ đề"],
    ["articles.content.1.body", "For example: educate, demonstrate your product, and show customer stories or behind-the-scenes work.", "Ví dụ: chia sẻ kiến thức, giới thiệu sản phẩm và kể câu chuyện khách hàng hoặc hậu trường."],
    ["articles.content.2.title", "2. Use questions as prompts", "2. Dùng câu hỏi làm gợi ý"],
    ["articles.content.2.body", "Answer the questions people ask before buying. One question can become a short video, carousel, and FAQ.", "Trả lời những câu hỏi khách thường đặt ra trước khi mua. Một câu hỏi có thể trở thành video ngắn, bài đăng nhiều ảnh và mục hỏi đáp."],
    ["articles.content.3.title", "3. Batch production", "3. Sản xuất nội dung theo đợt"],
    ["articles.content.3.body", "Set aside a short weekly session to draft several pieces and schedule them if useful.", "Dành một khoảng thời gian mỗi tuần để soạn vài nội dung và lên lịch đăng nếu phù hợp."],
    ["articles.content.4.title", "4. Review and repeat", "4. Đánh giá và lặp lại"],
    ["articles.content.4.body", "Look for saves, shares, meaningful comments, profile visits, and inquiries to see what is useful.", "Theo dõi lượt lưu, chia sẻ, bình luận có ý nghĩa, lượt xem hồ sơ và yêu cầu để hiểu nội dung nào hữu ích."],
    ["articles.metrics.title", "Metrics that matter in the beginning", "Những chỉ số quan trọng khi mới bắt đầu"],
    ["articles.metrics.intro", "The best metric depends on the question your campaign is trying to answer.", "Chỉ số phù hợp phụ thuộc vào câu hỏi mà chiến dịch muốn giải đáp."],
    ["articles.metrics.1.title", "Awareness", "Nhận biết"],
    ["articles.metrics.1.body", "Reach, relevant profile visits, and recall signals can help show whether people are discovering you.", "Lượt tiếp cận, lượt xem hồ sơ phù hợp và tín hiệu ghi nhớ giúp cho biết mọi người có đang khám phá thương hiệu hay không."],
    ["articles.metrics.2.title", "Engagement", "Tương tác"],
    ["articles.metrics.2.body", "Saves, shares, substantive comments, and clicks are often more informative than likes alone.", "Lượt lưu, chia sẻ, bình luận có nội dung và lượt nhấp thường hữu ích hơn chỉ riêng lượt thích."],
    ["articles.metrics.3.title", "Leads", "Khách hàng tiềm năng"],
    ["articles.metrics.3.body", "Track qualified inquiries, response rate, and cost per lead if paid promotion is used.", "Theo dõi yêu cầu phù hợp, tỷ lệ phản hồi và chi phí mỗi khách hàng tiềm năng nếu có quảng bá trả phí."],
    ["articles.metrics.4.title", "Sales", "Doanh số"],
    ["articles.metrics.4.body", "Measure conversion, revenue, gross margin, and repeat purchase where data is available.", "Đo lường chuyển đổi, doanh thu, biên lợi nhuận gộp và lượt mua lại khi có dữ liệu."],
    ["articles.metrics.5.title", "Make it actionable", "Biến kết quả thành hành động"],
    ["articles.metrics.5.body", "Choose one primary metric before a test and decide what result would justify a change.", "Chọn một chỉ số chính trước khi thử nghiệm và xác định kết quả nào sẽ dẫn đến điều chỉnh."],
    ["articles.validate.title", "Validate an idea before spending more", "Kiểm chứng ý tưởng trước khi chi thêm"],
    ["articles.validate.intro", "Early learning can reduce the risk of investing in an offer customers do not yet understand or want.", "Tìm hiểu sớm có thể giảm rủi ro đầu tư vào sản phẩm mà khách hàng chưa hiểu hoặc chưa cần."],
    ["articles.validate.1.title", "1. State the assumption", "1. Nêu rõ giả định"],
    ["articles.validate.1.body", "Write down who has the problem, how painful it is, and why your offer may help.", "Ghi lại ai gặp vấn đề, vấn đề nghiêm trọng đến đâu và sản phẩm của bạn có thể giúp gì."],
    ["articles.validate.2.title", "2. Talk to people", "2. Trò chuyện với mọi người"],
    ["articles.validate.2.body", "Use open questions about current behavior and alternatives—not just whether they like your idea.", "Đặt câu hỏi mở về hành vi hiện tại và lựa chọn thay thế, không chỉ hỏi họ có thích ý tưởng hay không."],
    ["articles.validate.3.title", "3. Run a small test", "3. Thực hiện thử nghiệm nhỏ"],
    ["articles.validate.3.body", "Try a prototype, sample, waitlist, or limited offer before committing to a large campaign.", "Thử nguyên mẫu, sản phẩm mẫu, danh sách chờ hoặc ưu đãi giới hạn trước khi đầu tư vào chiến dịch lớn."],
    ["articles.validate.4.title", "4. Decide what evidence means", "4. Xác định ý nghĩa của bằng chứng"],
    ["articles.validate.4.body", "Set a clear learning goal and review what people actually do, not only what they say.", "Đặt mục tiêu học hỏi rõ ràng và xem mọi người thực sự làm gì, không chỉ nghe điều họ nói."],
    ["articles.experiment.title", "Plan a 30-day marketing experiment", "Lập kế hoạch thử nghiệm marketing trong 30 ngày"],
    ["articles.experiment.intro", "A small experiment should answer one useful question and have a clear limit.", "Một thử nghiệm nhỏ nên trả lời một câu hỏi hữu ích và có giới hạn rõ ràng."],
    ["articles.experiment.1.title", "Week 1 — Define", "Tuần 1 — Xác định"],
    ["articles.experiment.1.body", "Choose one audience, one message, one channel, and one primary metric. Establish a baseline.", "Chọn một nhóm khách hàng, một thông điệp, một kênh và một chỉ số chính. Xác định mức cơ sở."],
    ["articles.experiment.2.title", "Week 2 — Launch", "Tuần 2 — Triển khai"],
    ["articles.experiment.2.body", "Publish the test and keep other changes limited so you can interpret results.", "Đăng thử nghiệm và hạn chế thay đổi khác để có thể diễn giải kết quả."],
    ["articles.experiment.3.title", "Week 3 — Observe", "Tuần 3 — Quan sát"],
    ["articles.experiment.3.body", "Collect customer feedback and monitor the chosen metric. Avoid changing everything at once.", "Thu thập phản hồi khách hàng và theo dõi chỉ số đã chọn. Tránh thay đổi mọi thứ cùng lúc."],
    ["articles.experiment.4.title", "Week 4 — Decide", "Tuần 4 — Quyết định"],
    ["articles.experiment.4.body", "Document what worked, what did not, and the next test. Scale only when evidence supports it.", "Ghi lại điều hiệu quả, điều chưa hiệu quả và thử nghiệm tiếp theo. Chỉ mở rộng khi có bằng chứng phù hợp."],
    ["consultation.hero.eyebrow", "Let's talk / 05", "Cùng trao đổi / 05"],
    ["consultation.hero.title", "Every startup has<br>a <span class=\"lime\">next question.</span>", "Mỗi startup đều có<br><span class=\"lime\">câu hỏi tiếp theo.</span>"],
    ["consultation.hero.description", "Tell us where you're stuck. The more context you share, the easier it is to understand what kind of support could help.", "Hãy chia sẻ điều bạn đang vướng mắc. Càng có nhiều thông tin, chúng tôi càng dễ hiểu hình thức hỗ trợ phù hợp."],
    ["consultation.intro.eyebrow", "Start a conversation", "Bắt đầu trao đổi"],
    ["consultation.intro.title", "Let's work out your next move.", "Cùng tìm bước đi tiếp theo cho bạn."],
    ["consultation.intro.description", "Whether you are choosing a channel, planning a budget, or trying to understand campaign results, start by sharing the challenge.", "Dù bạn đang chọn kênh, lập ngân sách hay tìm hiểu kết quả chiến dịch, hãy bắt đầu bằng cách chia sẻ thách thức."],
    ["consultation.contact.context.title", "Personalized context", "Thông tin phù hợp với bạn"],
    ["consultation.contact.context.description", "Share your business stage, audience, and immediate priorities.", "Chia sẻ giai đoạn kinh doanh, khách hàng và ưu tiên trước mắt của bạn."],
    ["consultation.contact.flexible.title", "Flexible consultation", "Hình thức tư vấn linh hoạt"],
    ["consultation.contact.flexible.description", "Choose online or in-person as a preferred method. Availability needs confirmation.", "Chọn hình thức trực tuyến hoặc gặp trực tiếp. Lịch hẹn cần được xác nhận."],
    ["consultation.contact.steps.title", "Practical next steps", "Bước tiếp theo thiết thực"],
    ["consultation.contact.steps.description", "Focus on useful actions that fit your current resources.", "Tập trung vào hành động hữu ích, phù hợp với nguồn lực hiện tại."],
    ["consultation.demo.note", "Demo note: this prototype validates the form in your browser but does not send submissions to a server or book an actual appointment.", "Lưu ý bản demo: website kiểm tra biểu mẫu ngay trên trình duyệt nhưng chưa gửi yêu cầu lên máy chủ hoặc đặt lịch tư vấn thật."],
    ["consultation.form.title", "Book a consultation", "Gửi yêu cầu tư vấn"],
    ["consultation.form.description", "Fields marked * are required.", "Các trường có dấu * là bắt buộc."],
    ["consultation.fields.fullName", "Full name *", "Họ và tên *"],
    ["consultation.placeholder.fullName", "Your name", "Tên của bạn"],
    ["consultation.fields.email", "Email address *", "Địa chỉ email *"],
    ["consultation.placeholder.email", "you@example.com", "ban@example.com"],
    ["consultation.fields.startup", "Startup name", "Tên startup"],
    ["consultation.placeholder.startup", "Your startup", "Tên startup của bạn"],
    ["consultation.fields.industry", "Business industry *", "Lĩnh vực kinh doanh *"],
    ["consultation.industry.placeholder", "Choose an industry", "Chọn lĩnh vực"],
    ["consultation.industry.food", "Food & beverage", "Ẩm thực và đồ uống"],
    ["consultation.industry.fashion", "Fashion & beauty", "Thời trang và làm đẹp"],
    ["consultation.industry.education", "Education", "Giáo dục"],
    ["consultation.industry.consumer", "Consumer products", "Sản phẩm tiêu dùng"],
    ["consultation.industry.services", "Services", "Dịch vụ"],
    ["consultation.industry.technology", "Technology", "Công nghệ"],
    ["consultation.industry.other", "Other", "Khác"],
    ["consultation.fields.budget", "Monthly marketing budget", "Ngân sách marketing hàng tháng"],
    ["consultation.budget.undecided", "Not decided yet", "Chưa xác định"],
    ["consultation.budget.under500", "Under 500,000 VND", "Dưới 500.000 VND"],
    ["consultation.budget.500to1m", "500,000–1,000,000 VND", "500.000–1.000.000 VND"],
    ["consultation.budget.1to3m", "1,000,000–3,000,000 VND", "1.000.000–3.000.000 VND"],
    ["consultation.budget.3to5m", "3,000,000–5,000,000 VND", "3.000.000–5.000.000 VND"],
    ["consultation.budget.over5m", "Over 5,000,000 VND", "Trên 5.000.000 VND"],
    ["consultation.fields.method", "Preferred method *", "Hình thức mong muốn *"],
    ["consultation.method.placeholder", "Choose a method", "Chọn hình thức"],
    ["consultation.method.online", "Online meeting", "Gặp trực tuyến"],
    ["consultation.method.inPerson", "In-person meeting", "Gặp trực tiếp"],
    ["consultation.method.email", "Email first", "Trao đổi qua email trước"],
    ["consultation.fields.date", "Preferred date", "Ngày mong muốn"],
    ["consultation.fields.time", "Preferred time", "Thời gian mong muốn"],
    ["consultation.time.flexible", "Flexible", "Linh hoạt"],
    ["consultation.time.morning", "Morning (9 AM–12 PM)", "Buổi sáng (9:00–12:00)"],
    ["consultation.time.afternoon", "Afternoon (1 PM–5 PM)", "Buổi chiều (13:00–17:00)"],
    ["consultation.time.evening", "Evening (6 PM–8 PM)", "Buổi tối (18:00–20:00)"],
    ["consultation.fields.challenge", "Current marketing challenges *", "Thách thức marketing hiện tại *"],
    ["consultation.placeholder.challenge", "What are you trying to solve? e.g. choosing channels, low engagement, limited budget...", "Bạn đang muốn giải quyết vấn đề gì? Ví dụ: chọn kênh, tương tác thấp, ngân sách hạn chế..."],
    ["consultation.submit", "Submit consultation request ↗", "Gửi yêu cầu tư vấn ↗"],
    ["consultation.submit.pending", "Submitting your request…", "Đang gửi yêu cầu…"],
    ["consultation.demo.success", "Your demo request has been validated in this browser. No message has been sent yet. Connect a backend or form service to receive real submissions.", "Yêu cầu demo đã được kiểm tra hợp lệ trên trình duyệt này. Chưa có thông tin nào được gửi đi. Cần kết nối máy chủ hoặc dịch vụ biểu mẫu để tiếp nhận yêu cầu thật."],
    ["consultation.demo.toast", "Demo form validated. Connect a backend for real submissions.", "Biểu mẫu demo hợp lệ. Cần kết nối máy chủ để gửi yêu cầu thật."],
    ["consultation.submit.error", "The request could not be submitted. Please try again.", "Không thể gửi yêu cầu. Vui lòng thử lại."],
    ["consultation.submit.networkError", "A network error occurred. Your entries are still here; please try again.", "Đã xảy ra lỗi mạng. Thông tin bạn nhập vẫn được giữ lại; vui lòng thử lại."],
    ["validation.required", "Please complete this field.", "Vui lòng điền thông tin này."],
    ["validation.invalidEmail", "Enter a valid email address.", "Vui lòng nhập địa chỉ email hợp lệ."],
    ["validation.invalidDate", "Choose today or a later date.", "Vui lòng chọn ngày hôm nay hoặc ngày trong tương lai."],
    ["validation.invalidValue", "Choose one of the available options.", "Vui lòng chọn một trong các lựa chọn."],
    ["common.close", "Close", "Đóng"],
    ["common.error", "Something went wrong.", "Đã xảy ra lỗi."],
    ["common.retry", "Try again", "Thử lại"],
    ["common.loading", "Loading…", "Đang tải…"],
    ["common.languageVietnamese", "Vietnamese", "Tiếng Việt"],
    ["common.languageEnglish", "English", "Tiếng Anh"],
    ["common.downloadFailure", "The file could not be downloaded.", "Không thể tải tệp."],
    ["accessibility.openNavigation", "Open navigation", "Mở điều hướng"],
    ["accessibility.closeNavigation", "Close navigation", "Đóng điều hướng"],
    ["accessibility.home", "Growise home", "Trang chủ Growise"],
    ["accessibility.particleOrb", "Glowing 3D particle sphere. Drag to rotate.", "Khối cầu hạt 3D phát sáng, có thể kéo để xoay."],
    ["accessibility.closeGuide", "Close guide", "Đóng hướng dẫn"],
    ["accessibility.switchToVietnamese", "Switch language to Vietnamese", "Chuyển ngôn ngữ sang tiếng Việt"],
    ["accessibility.switchToEnglish", "Switch language to English", "Chuyển ngôn ngữ sang tiếng Anh"],
    ["accessibility.languageSwitcher", "Language", "Ngôn ngữ"],
    ["accessibility.visual", "Animated growth orb", "Khối cầu tăng trưởng chuyển động"],
    ["footer.description", "Your Partner in Startup Growth. Helping student founders make smarter marketing decisions, one step at a time.", "Đồng hành cùng startup tăng trưởng. Giúp nhà sáng lập sinh viên đưa ra quyết định marketing sáng suốt, từng bước một."],
    ["footer.explore", "Explore", "Khám phá"],
    ["footer.about", "About us", "Về chúng tôi"],
    ["footer.services", "Services", "Dịch vụ"],
    ["footer.resources", "Resources", "Tài nguyên"],
    ["footer.tools", "Tools", "Công cụ"],
    ["footer.planner", "Budget planner", "Lập kế hoạch ngân sách"],
    ["footer.consultation", "Book a consultation", "Gửi yêu cầu tư vấn"],
    ["footer.principle", "Our principle", "Nguyên tắc"],
    ["footer.clarity", "Clarity over hype.", "Rõ ràng thay vì phô trương."],
    ["footer.learning", "Learn before scaling.", "Học hỏi trước khi mở rộng."],
    ["footer.copyright", "© 2026 Growise · Student startup growth concept", "© 2026 Growise · Đồ án website hỗ trợ startup sinh viên"],
    ["footer.signature", "Made for ideas in motion ↗", "Dành cho những ý tưởng đang chuyển động ↗"],
    ["planSummary.title", "GROWISE — STARTUP MARKETING PLAN", "GROWISE — KẾ HOẠCH MARKETING STARTUP"],
    ["planSummary.defaultStartup", "My startup", "Startup của tôi"],
    ["planSummary.defaultOffer", "Not specified", "Chưa cung cấp"],
    ["planSummary.startup", "Startup", "Startup"],
    ["planSummary.offer", "Offer", "Sản phẩm / dịch vụ"],
    ["planSummary.monthlyBudget", "Monthly budget", "Ngân sách hàng tháng"],
    ["planSummary.allocationTitle", "Suggested allocation", "Phân bổ ngân sách gợi ý"],
    ["planSummary.firstTest", "First test", "Thử nghiệm đầu tiên"],
    ["planSummary.primaryMetric", "Primary metric", "Chỉ số chính"],
    ["planSummary.priorities", "Priorities", "Ưu tiên"],
    ["planSummary.note", "Note: illustrative starting assumptions; validate with real customer and campaign data.", "Lưu ý: đây là giả định ban đầu mang tính minh họa; hãy kiểm chứng bằng dữ liệu khách hàng và chiến dịch thực tế."],
    ["planSummary.filename", "growise-marketing-plan", "growise-ke-hoach-marketing"]
  ];

  const messages = { vi: Object.create(null), en: Object.create(null) };
  const sourceKeys = new Map();
  for (const [key, en, vi] of entries) {
    messages.en[key] = en;
    messages.vi[key] = vi;
    if (en.length > 2 && !sourceKeys.has(en)) sourceKeys.set(en, key);
  }

  const articleDefinitions = {
    budget: [1, 2, 3, 4, 5],
    audience: [1, 2, 3, 4],
    content: [1, 2, 3, 4],
    metrics: [1, 2, 3, 4, 5],
    validate: [1, 2, 3, 4],
    experiment: [1, 2, 3, 4]
  };
  const storageKey = "growise.locale";
  const originalText = new WeakMap();
  const missingKeys = new Set();
  const supportedLocales = new Set(["vi", "en"]);
  let initialTextNodes = null;

  function readLocale() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return supportedLocales.has(saved) ? saved : "vi";
    } catch (error) {
      return "vi";
    }
  }

  let locale = readLocale();

  function t(key, params = {}) {
    const template = messages[locale][key];
    if (typeof template !== "string") {
      missingKeys.add(key);
      return `⟦${key}⟧`;
    }
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    );
  }

  function apply(root = document) {
    document.documentElement.lang = locale;
    document.title = t("meta.title");

    const scope = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
    if (!scope) return;
    if (!initialTextNodes && root === document) {
      const initialWalker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      initialTextNodes = [];
      let initialNode;
      while ((initialNode = initialWalker.nextNode())) {
        if (!initialNode.parentElement?.closest("script, style, [data-i18n-html], [data-i18n-ignore]")) {
          originalText.set(initialNode, initialNode.nodeValue);
          initialTextNodes.push(initialNode);
        }
      }
    }

    const elements = [];
    if (scope.nodeType === Node.ELEMENT_NODE) elements.push(scope);
    elements.push(...scope.querySelectorAll(
      "[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title], [data-i18n-content]"
    ));
    for (const element of elements) {
      if (element.hasAttribute("data-i18n")) {
        element.textContent = t(element.dataset.i18n);
      }
      if (element.hasAttribute("data-i18n-html")) {
        element.innerHTML = t(element.dataset.i18nHtml);
      }
      if (element.hasAttribute("data-i18n-placeholder")) {
        element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
      }
      if (element.hasAttribute("data-i18n-aria-label")) {
        element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
      }
      if (element.hasAttribute("data-i18n-title")) {
        element.setAttribute("title", t(element.dataset.i18nTitle));
      }
      if (element.hasAttribute("data-i18n-content")) {
        element.setAttribute("content", t(element.dataset.i18nContent));
      }
    }

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, [data-i18n-html], [data-i18n-ignore]")) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const trimmed = source.trim();
      const key = sourceKeys.get(trimmed);
      if (!key) continue;
      const start = source.length - source.trimStart().length;
      const end = source.trimEnd().length;
      node.nodeValue = source.slice(0, start) + t(key) + source.slice(end);
    }

    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("meta.description"));

    document.querySelectorAll("[data-locale]").forEach((button) => {
      const selected = button.dataset.locale === locale;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("active", selected);
    });
  }

  function setLocale(nextLocale) {
    if (!supportedLocales.has(nextLocale)) return false;
    const changed = locale !== nextLocale;
    locale = nextLocale;
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch (error) {
      // The selected locale still applies for this page load if storage is unavailable.
    }
    apply(document);
    if (changed) {
      document.dispatchEvent(new CustomEvent("growise:localechange", {
        detail: { locale }
      }));
    }
    return true;
  }

  function getArticle(slug) {
    const itemNumbers = articleDefinitions[slug];
    if (!itemNumbers) return null;
    return {
      title: t(`articles.${slug}.title`),
      intro: t(`articles.${slug}.intro`),
      items: itemNumbers.map((number) => [
        t(`articles.${slug}.${number}.title`),
        t(`articles.${slug}.${number}.body`)
      ])
    };
  }

  function getUntranslatedText() {
    if (!initialTextNodes) return [];
    return initialTextNodes
      .map((node) => originalText.get(node) || "")
      .map((text) => text.trim())
      .filter((text, index) =>
        text.length > 2
        && /[A-Za-z]/.test(text)
        && !sourceKeys.has(text)
        && !/^GROWISE$/i.test(text)
        && document.body.contains(initialTextNodes[index])
      );
  }

  const api = {
    getLocale: () => locale,
    t,
    setLocale,
    apply,
    getArticle,
    getMissingKeys: () => [...missingKeys],
    getUntranslatedText,
    getKnownKeys: () => Object.keys(messages.en)
  };

  window.Growise = window.Growise || {};
  window.Growise.i18n = api;
  apply(document);
})();
