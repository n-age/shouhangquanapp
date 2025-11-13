# 数据库集合结构设计

本文档定义了“无人机飞手服务平台”微信小程序云开发数据库的核心集合结构。

## 1. Users (用户)

存储平台所有角色的用户信息。

- `_id`: String (自动生成, 主键)
- `_openid`: String (微信用户唯一标识)
- `nickName`: String (微信昵称)
- `avatarUrl`: String (微信头像)
- `gender`: Number (性别: 0-未知, 1-男, 2-女)
- `role`: Array [String] (用户角色, e.g., ['customer', 'pilot'])
- `realName`: String (实名认证姓名, 冗余字段)
- `isRealNameVerified`: Boolean (是否实名认证)
- `isPilotVerified`: Boolean (是否飞手认证)
- `isEnterpriseVerified`: Boolean (是否企业认证)
- `balance`: Number (账户余额, 暂定)
- `createdAt`: Date (创建时间)
- `updatedAt`: Date (更新时间)

## 2. Authentications (认证信息)

存储所有类型的认证申请。

- `_id`: String (自动生成, 主键)
- `userId`: String (关联 Users 集合的 _id)
- `type`: String (认证类型: 'realName', 'enterprise', 'pilot')
- `data`: Object (提交的认证数据)
  - `realName`: String (真实姓名, for realName)
  - `idCardNumber`: String (身份证号, for realName)
  - `idCardImageUrl`: String (手持身份证照片, for realName)
  - `enterpriseName`: String (企业名称, for enterprise)
  - `creditCode`: String (信用代码, for enterprise)
  - `licenseUrl`: String (营业执照, for enterprise)
  - `certificateType`: String (证书类型, for pilot)
  - `certificateNumber`: String (证书编号, for pilot)
  - `certificateUrl`: String (证书照片, for pilot)
- `status`: String (审核状态: 'pending', 'approved', 'rejected')
- `rejectReason`: String (审核拒绝原因, optional)
- `createdAt`: Date (申请时间)
- `updatedAt`: Date (审核时间)

## 3. Tasks (任务)

存储发布的任务信息。

- `_id`: String (自动生成, 主键)
- `publisherId`: String (发布者ID, 关联 Users 集合的 _id)
- `title`: String (任务标题)
- `description`: String (任务描述)
- `reward`: Number (任务报酬)
- `location`: Object (任务地点, GeoPoint)
- `address`: String (详细地址)
- `deadline`: Date (截止日期)
- `tags`: Array [String] (任务标签, e.g., ['航拍摄影'])
- `status`: String (任务状态: 'open', 'in_progress', 'completed', 'cancelled')
- `createdAt`: Date (发布时间)
- `updatedAt`: Date (更新时间)

## 4. Orders (订单)

存储任务被接受后生成的订单。

- `_id`: String (自动生成, 主键)
- `taskId`: String (关联 Tasks 集合的 _id)
- `publisherId`: String (发布者ID, 关联 Users 集合的 _id)
- `pilotId`: String (飞手ID, 关联 Users 集合的 _id)
- `orderNumber`: String (订单编号)
- `amount`: Number (订单金额)
- `status`: String (订单状态: 'pending_payment', 'in_progress', 'pending_confirmation', 'completed', 'cancelled', 'disputed')
- `paymentStatus`: String (支付状态: 'unpaid', 'paid')
- `workSubmission`: Object (飞手提交的工作成果, optional)
  - `description`: String
  - `files`: Array [String] (文件云存储地址)
- `createdAt`: Date (创建时间)
- `updatedAt`: Date (更新时间)
- `paidAt`: Date (支付时间, optional)
- `completedAt`: Date (完成时间, optional)

## 5. News (新闻资讯)

存储新闻文章。

- `_id`: String (自动生成, 主键)
- `title`: String (文章标题)
- `content`: String (文章内容, HTML 或 Markdown)
- `coverImageUrl`: String (封面图地址)
- `category`: String (文章分类)
- `author`: String (作者或来源)
- `views`: Number (浏览量)
- `likes`: Number (点赞数)
- `collections`: Number (收藏数)
- `isPublished`: Boolean (是否发布)
- `createdAt`: Date (创建时间)
- `publishedAt`: Date (发布时间)
