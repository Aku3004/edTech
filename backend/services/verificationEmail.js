import transporter from "./transporter.js"


export const sendVerificationEmail=async(email,url)=>{
    try{
        await transporter.sendMail({
        from:"Edtech Support <gangwani.aakash30@gmail.com>",
        subject:"Verify your email",
        to:email,
        text:`click to verify:${url}`,
    });
    }catch(err){
            // Log but DO NOT crash signup
       console.error("Email sending failed:", err.message);
    }
   
};