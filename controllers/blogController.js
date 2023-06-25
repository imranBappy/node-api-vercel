const Auth = require('../models/Auth')
const Blog = require('../models/Blog')
const Comment = require('../models/Comment')

const truncate = require('../utils/truncate')
// Require the cloudinary library




// const uploadImage = async (imagePath) => {

//     // Use the uploaded file's name as the asset's public ID and 
//     // allow overwriting the asset with new versions
//     const options = {
//         use_filename: true,
//         unique_filename: false,
//         overwrite: true,
//     };

//     try {
//         // Upload the image
//         const result = await cloudinary.uploader.upload(imagePath, options);
//         console.log({ result });
//         return result.public_id;
//     } catch (error) {
//         console.error(error);
//     }
// };


// blog post controller
exports.blogPostController = async (req, res, next) => {
    let { title, content } = req.body
    const filePath = "D:/web/blog-assessment/server/public/uploads/" + req.file?.filename;
    // console.log({ filePath });
    // let x = await uploadImage(filePath)

    // cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
    //     { public_id: "31231233412412" },
    //     function (error, result) {
    //         console.log(result);
    //         console.log(error);
    //     });



    let blog = new Blog({
        title,
        content,
        author: req.user._id,
        thumbnail: req.file ? `/uploads/${req.file?.filename}` : "",
        likes: [],
    })
    try {
        let createdBlog = await blog.save()
        await Auth.findOneAndUpdate(
            { user: req.user._id },
            { $push: { 'blogs': createdBlog._id } }
        )
        res.json({ blog })
    } catch (e) {
        next(e)
    }
}

// blog get controller

exports.blogsGetController = async (req, res, next) => {
    let currentPage = parseInt(req.query.page) || 1
    let itemPerPage = 10
    // let { order, filterObj } = generateFilterObb(filter.toLowerCase())
    let order = 1;
    try {
        let blogs = await Blog.find({})
            .populate('author', '_id name url')
            .sort(order === 1 ? '-createdAt' : 'createdAt')
            .skip((itemPerPage * currentPage) - itemPerPage)
            .limit(itemPerPage)

        blogs = blogs.map(blog => ({
            ...blog._doc,
            content: truncate(blog._doc.content)
        }))
        res.json(blogs)

    } catch (error) {
        next(error)
    }
}

exports.blogGetController = async (req, res, next) => {
    const { blogId } = req.params
    try {
        let blog = await Blog.findById(blogId)
            .populate({
                path: 'comments',
                select: 'body createdAt',
                populate: {
                    path: 'user',
                    select: 'name url'
                }
            })
        res.json(blog)
    } catch (error) {
        next(error)
    }
}

exports.blogPatchController = async (req, res, next) => {
    const { blogId } = req.params
    const { title, content } = req.body
    try {
        let blog = await Blog.findByIdAndUpdate(blogId, {
            title: title,
            content: content
        })
        res.json(blog)
    } catch (error) {
        next(error)
    }
}

exports.blogDeleteController = async (req, res, next) => {
    const { blogId } = req.params
    try {
        let blog = await Blog.findOne({ _id: blogId })
        if (!blog) {
            let error = new Error('404 blog not found')
            error.status = 404
            throw error
        }
        await Blog.findOneAndDelete({ _id: blogId })
        await Auth.findOneAndUpdate(
            { user: req.user._id },
            { $pull: { 'blogs': blogId } }
        )
        await Comment.deleteMany({
            blog: blog
        })
        res.json({
            message: "Blog Successfully deleted!"
        })
    } catch (error) {
        next(error)
    }
}
