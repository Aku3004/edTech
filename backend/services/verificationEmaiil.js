import transporter from "./transporter.js"


export const sendVerificationEmail=async(email,url)=>{
    await transporter.sendMail({
        from:"Edtech Support <gangwani.aakash30@gmail.com>",
        subject:"Verify your email",
        to:email,
        text:`click to verify:${url}`,
    });
};