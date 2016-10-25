// Component here uses ES6 destructuring syntax in import, what is means is "retrieve the property 'Component' off of the object exported from the 'react'"
import React, { Component } from 'react';
import request from './utils/request';

import Navbar from './Navbar';
import Blog from './Blog';

import './App.css';


export default class App extends Component {
  state = {};

  addPost = postState => {
    const postBody = {
      title: postState.title,
      body: postState.body
    };

    // Adding authed properties if user is logged in
    if(this.state.user) postBody.email = this.state.user.email;
    if(this.state.user && this.state.user.google && this.state.user.google.photo) {
      postBody.photo = this.state.user.google.photo;
      postBody.google_link = this.state.user.google.link;
    }
    if(this.state.user && this.state.user.facebook && this.state.user.facebook.photo) {
      postBody.photo = this.state.user.facebook.photo;
      postBody.facebook_link = this.state.user.facebook.link;
    }

    request.post({
      route: '/api/post',
      body: postBody
    }).then(res => this.setState({
      posts: this.state.posts.unshift(res.data) && this.state.posts
    }));
  };

  updatePost = (postState, id) => {
    const index = postState.editIndex;
    request.put({
      route: `/api/post/${this.state.posts[index]._id}`,
      body: {
        title: postState.title,
        body: postState.body,
        createdDate: new Date()
      }
    }).then(res => {
      const newPostsArr = [...this.state.posts];
      newPostsArr[index] = res.data;
      this.setState({
        posts: newPostsArr
      });
    });
  };

  deletePost = id =>
    request.delete(`/api/post/${id}`)
      .then(() => this.setState({
        posts: this.state.posts.filter(val => val._id !== id)
      }));

  localAuth = (email, password) =>
    request.post({
      route: '/auth/login',
      body: {
        email: email || this.state.user.email, //the "or" handles if they're already authedand are adding a password to their account
        password: password
      }
    }).then(res =>
      this.setState({
        user: res.data
      }));

  logout = () =>
    request.get('/auth/logout')
      .then(() =>
        this.setState({
          user: null
        }));

  componentDidMount() {
    // retrieve app initialization data once root component has mounted
    Promise.all([
      request.get('/auth/session'),
      request.get('/api/post')
    ])
    .then(resArr =>
      this.setState({
        user: resArr[0].data || null,
        posts: resArr[1].data.sort((a,b) => Date.parse(b.createdDate) - Date.parse(a.createdDate))
      })
    ).catch(err => console.log(err));
  }

  render() {
    return (
      <div>
        <Navbar
          user={this.state.user}
          localAuth={this.localAuth}
          logout={this.logout}
        />
        <Blog
          posts={this.state.posts}
          userEmail={this.state.user && this.state.user.email}
          addPost={this.addPost}
          updatePost={this.updatePost}
          deletePost={this.deletePost}
        />
      </div>
    );
  }
}
