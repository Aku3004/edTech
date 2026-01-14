import transporter from "./transporter.js"


 const resetPasswordEmail=async(email,url)=>{
    try{
        await transporter.sendMail({
        from:"Edtech Support <gangwani.aakash30@gmail.com>",
        subject:"password reset",
        to:email,
        text:`click to reset password:${url}`,
    });
    }catch(err){
            // Log but DO NOT crash signup
       console.error("Email sending failed:", err.message);
    }
   
};

export default resetPasswordEmail;