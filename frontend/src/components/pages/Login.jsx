
import React, { useState } from "react";
import "../pages/auth.form.scss"


import {useNavigate,Link} from 'react-router-dom';

import { useAuth } from "../../features/auth/hooks/useAuth";



const Login =()=>{

    const {loadning,handlelogin} = useAuth()

    const [email ,setEmail] = useState("");
    const [ password , setpassword] = useState(second);

     onst [first , setfirst] =useState(second);

    const navigate = useNavigate();
    const handleSubmit = async (e)=>{
        e.preventDefault();
        await handlelogin({email , password})
        navigate('/')

    }

    if(loading){
        return (<main><h1>Loading....</h1></main>)
    }
    return(
        <main>
            <div className="form-container">

                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input 
                         onChange={(e)=>{setEmail(e.target.value)}}
                         type="email" id="email" name="email" placeholder="Enter your email" required />

                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                        onChange={(e) =>{setpassword(e.target.value)}}
                         type="password" id="password" name="password" placeholder="Enter your password" required />

                    </div>
                    <button className="button button-primary">Login</button>
                </form>
                     <p>Don't have an account? <Link to="/register">Register</Link></p>

            </div>
        </main>
    )
}

export default Login;
