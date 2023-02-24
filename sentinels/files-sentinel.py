import pyinotify
import sys
import os
import pathlib
import json
import subprocess
import shlex

class FileSentinelEvent(pyinotify.ProcessEvent):

    def my_init(self, config):
        self.config = config
        self.remotes = self.config["REMOTES"]
        self.base = pathlib.Path(self.config["USER_DIR"])

    def log(self, text):
        sys.stdout.write(str(text) + "\n")
        sys.stdout.flush()


    def relative_path(self, path):
        try:
            return pathlib.Path(path).relative_to(self.base)
        except:
            return False
    
    def first_existing_path(self, pathname):
        if not pathname or not self.relative_path(pathname):
            return self.base + "/"

        if os.path.exists(pathname):
            if os.path.isdir(pathname):
                return pathname + "/"
            else:
                return pathname 

        return self.first_existing_path(os.path.dirname(pathname))
        

    def cmd(self, cmd, pathname=None):
        for remote in self.remotes:
            e = str(cmd)
            if remote[0]:
                e = e.replace("[remote]", remote[0]+":")
            else:
                e = e.replace("[remote]", "")

            if pathname:
                pathname = self.first_existing_path(pathname)
                remotepath = os.path.join(remote[1], self.relative_path(pathname))
                e = e.replace("[remotepath]", remotepath)
                e = e.replace("[localpath]", pathname)
            self.log(e)
            args = shlex.split(e)
            subprocess.call(args, stderr=subprocess.STDOUT)
            sys.stdout.flush()

    def rsync(self, pathname=None):
        if not pathname:
            pathname = self.base
        e = "rsync -a [localpath] [remote][remotepath] --delete --mkpath"
        self.cmd(e, pathname)

    def process_default(self, event):
        if event.maskname == "IN_IGNORED":
            return

        self.log(event.maskname)
        self.rsync(event.pathname)



if __name__ == '__main__':
    mepath=os.path.dirname(os.path.realpath(__file__))
    config_file = os.path.join(mepath, "..", "config.json")
    config = json.load(open(config_file))

    #emask = pyinotify.IN_CREATE | pyinotify.IN_DELETE | pyinotify.IN_MODIFY | pyinotify.IN_MOVED_FROM | pyinotify.IN_MOVED_TO
    emask = pyinotify.IN_CREATE
    emask |= pyinotify.IN_DELETE
    emask |= pyinotify.IN_MODIFY
    emask |= pyinotify.IN_MOVED_FROM
    emask |= pyinotify.IN_MOVED_TO

    handler = FileSentinelEvent(config=config)
    watch_path = config.get("USER_DIR", "./")
    handler.log(f"watching: {watch_path}")

    wm = pyinotify.WatchManager()
    notifier = pyinotify.Notifier(wm, default_proc_fun=handler)
    excl = pyinotify.ExcludeFilter(['.*\.cncfm.*',])
    wm.add_watch(watch_path, emask, auto_add=True, rec=True, exclude_filter=excl)
    notifier.loop()